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
  status TEXT NOT NULL DEFAULT 'approved'
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
