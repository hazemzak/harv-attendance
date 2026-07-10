-- Parent/guardian WhatsApp number, separate from the student's own number —
-- so the parent can be sent their own copy of the /student attendance link
-- (fraud prevention: student claiming to attend when they don't).
ALTER TABLE students ADD COLUMN parent_phone TEXT;
