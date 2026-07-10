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
  parent_phone TEXT
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
