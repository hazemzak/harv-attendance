-- Up to 3 day+time-range slots per teacher, replacing free-text
-- teachers.schedule as the source of truth (that column is now
-- deprecated/unread, left in place — same additive stance as 0009/0016).
-- A later drag-drop weekly scheduling grid reads these rows as availability
-- "snap targets". day_of_week is a slug matching groups.day
-- (sat/sun/mon/tue/wed/thu/fri); start_time/end_time are 24h "HH:MM".
CREATE TABLE teacher_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);
CREATE INDEX idx_teacher_availability_teacher ON teacher_availability(teacher_id);
