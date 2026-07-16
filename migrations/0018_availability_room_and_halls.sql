-- Optional hall assignment per availability slot, so a clerk picking a
-- teacher's day+time here can also assign which hall it's held in — read
-- later by the drag-drop scheduling grid as a pre-filled placement, not just
-- a raw availability hint.
ALTER TABLE teacher_availability ADD COLUMN room_id INTEGER REFERENCES rooms(id);

-- Placeholder hall names (Hazem: rename via /admin/rooms whenever convenient).
INSERT INTO rooms (name) VALUES ('قاعة 1'), ('قاعة 2'), ('قاعة 3'), ('قاعة 4');
