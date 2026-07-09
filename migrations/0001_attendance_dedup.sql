-- Prevent duplicate attendance rows for the same student on the same day
-- (double-scanning the same QR code).
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_day
  ON attendance(student_id, date(scanned_at));
