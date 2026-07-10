-- Student self-registration: school/stage/phone/email/photo + approval status
-- for public unauthenticated submissions (pending until staff approves).
ALTER TABLE students ADD COLUMN school TEXT;
ALTER TABLE students ADD COLUMN stage TEXT;
ALTER TABLE students ADD COLUMN phone TEXT;
ALTER TABLE students ADD COLUMN email TEXT;
ALTER TABLE students ADD COLUMN photo BLOB;
ALTER TABLE students ADD COLUMN photo_type TEXT;
ALTER TABLE students ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';
