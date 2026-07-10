-- Teacher/schedule reference data (imported from the design-system repo's
-- data/teachers.json — see scripts/import-teachers.js) and staff-facing
-- promotions ("ads") so a clerk processing a registration can see who's
-- available for the student's picked subjects, plus any active offers.
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_label TEXT,
  phase TEXT,
  mode TEXT,
  schedule TEXT,
  track TEXT
);

CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT,
  teacher_name TEXT,
  text TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
