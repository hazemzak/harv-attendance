-- Class groups + rooms, extracted from the retired CenterStudent app's
-- Groupdata/roomdata tables (see HARV_ATTENDANCE_SUPPORT_PLAYBOOK.md 2026-07-13
-- row). A group is a real catalog entry (teacher+subject+day+time+price+capacity)
-- that a booking can attach to, instead of free-text teacher/schedule only.
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

-- Nullable: legacy bookings keep their free-text teacher_name/schedule and are
-- never backfilled. status/status_reason give bookings a drop/transfer lifecycle
-- (old app's deleted_from_group table tracked exactly this, e.g. "حذف لتكرار الغياب").
ALTER TABLE bookings ADD COLUMN group_id INTEGER REFERENCES groups(id);
ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE bookings ADD COLUMN status_reason TEXT;

CREATE INDEX idx_groups_active ON groups(active);
CREATE INDEX idx_bookings_group ON bookings(group_id);
