-- Adds the teacher photo path, already present in the design-system repo's
-- data/teachers.json (trusted roster source) as t.photo, but previously
-- dropped by scripts/import-teachers.js. Additive/nullable, existing rows
-- unaffected until the next re-import.
ALTER TABLE teachers ADD COLUMN photo TEXT;
