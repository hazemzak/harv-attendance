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
  share_type TEXT,
  share_value REAL
);

-- Staff roles, keyed by the Cloudflare Access-authenticated email (no separate
-- password system — Access already authenticates every /admin* request).
CREATE TABLE staff (
  email TEXT PRIMARY KEY,
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
  status TEXT NOT NULL DEFAULT 'active',
  status_reason TEXT,
  discount_amount REAL NOT NULL DEFAULT 0,
  discount_note TEXT
);

CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_group ON bookings(group_id);

-- Money actually received. A student's balance = SUM(active bookings.amount)
-- - SUM(bookings.discount_amount) - SUM(payments.amount), computed on read.
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id),
  amount REAL NOT NULL,
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
  amount REAL NOT NULL,
  note TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE INDEX idx_ledger_occurred ON ledger(occurred_at);
