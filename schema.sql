CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  class TEXT,
  school TEXT,
  stage TEXT,
  phone TEXT,
  email TEXT,
  photo BLOB,
  photo_type TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  subjects TEXT,
  payment_method TEXT,
  parent_phone TEXT,
  father_phone TEXT,
  mother_phone TEXT,
  home_phone TEXT,
  address TEXT,
  track TEXT
);

-- group_id/teacher_name: per-session attendance tied to a class group (nullable —
-- ungrouped/walk-in scans keep group_id NULL). teacher_name is a snapshot at scan
-- time, independent of the groups row being renamed/deactivated later.
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  scanned_at TEXT NOT NULL DEFAULT (datetime('now')),
  group_id INTEGER REFERENCES groups(id),
  teacher_name TEXT
);

-- A student can attend two *different* groups the same day, but not
-- double-scan the *same* group. NULL group_id (walk-in scans) isn't covered
-- by this index — SQLite treats each NULL as distinct — markAttendance()
-- guards that case in code instead.
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_group_day
  ON attendance(student_id, group_id, date(scanned_at));

-- Restores the one-scan-per-day guarantee for ungrouped rows (the index above
-- can't, since SQLite treats every NULL group_id as distinct).
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_nogroup_day
  ON attendance(student_id, date(scanned_at)) WHERE group_id IS NULL;

-- share_type/share_value: 'percent' of collected payments on their groups'
-- bookings, or 'per_session' EGP per attendance row logged against their groups.
CREATE TABLE teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_label TEXT,
  phase TEXT,
  mode TEXT,
  schedule TEXT,
  track TEXT,
  photo TEXT,
  share_type TEXT CHECK (share_type IN ('percent', 'per_session')),
  share_value REAL,
  photo_blob BLOB,
  photo_blob_type TEXT
);

-- Up to 3 day+time-range slots per teacher, replacing free-text
-- teachers.schedule as the source of truth (that column is left in place,
-- deprecated/unread). day_of_week matches groups.day's short slugs.
CREATE TABLE teacher_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room_id INTEGER REFERENCES rooms(id)
);
CREATE INDEX idx_teacher_availability_teacher ON teacher_availability(teacher_id);

-- Staff roles, keyed by the Cloudflare Access-authenticated email (no separate
-- password system — Access already authenticates every /admin* request).
CREATE TABLE staff (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'clerk', 'viewer')),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT,
  teacher_name TEXT,
  text TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  floor TEXT,
  capacity INTEGER
);

CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT REFERENCES teachers(id),
  teacher_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  stage TEXT,
  day TEXT,
  time TEXT,
  room_id INTEGER REFERENCES rooms(id),
  capacity INTEGER,
  price REAL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_groups_active ON groups(active);

-- The paper estamara's per-subject table (المادة/الأستاذ/المواعيد/المبلغ) —
-- one row per subject a student books. Total is SUM(amount), computed on read.
-- group_id links to a groups() catalog entry when the booking was made against
-- one (nullable: legacy/ad-hoc bookings keep free-text teacher_name/schedule).
-- status/status_reason give a booking a drop/transfer lifecycle.
-- discount_amount/discount_note: per-booking discount, subtracted from amount
-- when computing a student's balance.
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT,
  teacher_name TEXT,
  schedule TEXT,
  amount REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  group_id INTEGER REFERENCES groups(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped')),
  status_reason TEXT,
  discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  discount_note TEXT
);

CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_group ON bookings(group_id);

-- Money actually received. A student's balance = SUM(active bookings.amount)
-- - SUM(bookings.discount_amount) - SUM(payments.amount), computed on read.
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  method TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE INDEX idx_payments_student ON payments(student_id);

-- The center's own income/expense journal. Recording a payment auto-posts a
-- matching kind='income' row — expenses are entered directly.
CREATE TABLE ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  category TEXT,
  amount REAL NOT NULL CHECK (amount >= 0),
  note TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,
  period_to TEXT,
  teacher_id TEXT
);

CREATE INDEX idx_ledger_occurred ON ledger(occurred_at);

-- Per-group split of each payment (see migration 0014). A payment settles a
-- student's whole balance across possibly several teachers' groups, and this
-- table proportionally attributes each payment's cash to the student's active
-- bookings, so a 'percent'-share teacher's owed = their share_value% of
-- what was actually collected against their groups. group_id is a snapshot
-- (no FK) so an allocation survives a later booking drop / group removal.
CREATE TABLE payment_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_payment_alloc_group ON payment_allocations(group_id);
