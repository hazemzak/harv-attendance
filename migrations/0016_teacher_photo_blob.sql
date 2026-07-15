-- Additive: lets a teacher's photo be uploaded directly through the app
-- instead of only existing as a path into the design-system repo's static
-- folder. Existing `teachers.photo` (text path) is untouched for all current
-- rows — this is a second, optional photo source, same pattern as
-- students.photo/photo_type.
ALTER TABLE teachers ADD COLUMN photo_blob BLOB;
ALTER TABLE teachers ADD COLUMN photo_blob_type TEXT;
