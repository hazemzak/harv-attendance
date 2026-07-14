-- Per-session attendance, tied to a class group instead of just "showed up
-- today" globally — extracted from the old CenterStudent app's per-session
-- tracking (center_service/hessas). teacher_name is a snapshot at scan time
-- (survives a teacher/group being renamed or deactivated later).
ALTER TABLE attendance ADD COLUMN group_id INTEGER REFERENCES groups(id);
ALTER TABLE attendance ADD COLUMN teacher_name TEXT;

-- Replaces idx_attendance_student_day: a student can attend two *different*
-- groups the same day, but not double-scan the *same* group. NULL group_id
-- (ungrouped/walk-in scans) is NOT covered by this index — SQLite treats each
-- NULL as distinct, so markAttendance() guards that case in code instead.
DROP INDEX IF EXISTS idx_attendance_student_day;
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_group_day
  ON attendance(student_id, group_id, date(scanned_at));

-- The index above only helps grouped scans (SQLite treats every NULL group_id
-- as distinct, so it can't dedupe ungrouped rows) — this partial index
-- restores the exact one-scan-per-day guarantee idx_attendance_student_day
-- used to give, scoped to the ungrouped case only.
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_nogroup_day
  ON attendance(student_id, date(scanned_at)) WHERE group_id IS NULL;
