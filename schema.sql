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

CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Prevent duplicate attendance rows for the same student on the same day
-- (double-scanning the same QR code).
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_day
  ON attendance(student_id, date(scanned_at));

CREATE TABLE teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_label TEXT,
  phase TEXT,
  mode TEXT,
  schedule TEXT,
  track TEXT
);

CREATE TABLE promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT,
  teacher_name TEXT,
  text TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The paper estamara's per-subject table (المادة/الأستاذ/المواعيد/المبلغ) —
-- one row per subject a student books. Total is SUM(amount), computed on read.
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT,
  teacher_name TEXT,
  schedule TEXT,
  amount REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_bookings_student ON bookings(student_id);
