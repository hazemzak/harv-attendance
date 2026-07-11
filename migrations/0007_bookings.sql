-- The paper estamara's per-subject table (المادة/الأستاذ/المواعيد/المبلغ) —
-- one row per subject a student books, recorded by the clerk during
-- /admin/students/:id/process. Total (إجمالي قيمة الحجز) is SUM(amount),
-- computed on read, never stored.
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
