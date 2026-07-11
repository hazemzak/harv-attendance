-- Fields from the paper استمارة الحجز (reservation form) not yet captured:
-- father/mother/home phone, address, and an explicit track (عربي/لغات) —
-- previously only inferred implicitly per-subject via the English-cousin slugs.
ALTER TABLE students ADD COLUMN father_phone TEXT;
ALTER TABLE students ADD COLUMN mother_phone TEXT;
ALTER TABLE students ADD COLUMN home_phone TEXT;
ALTER TABLE students ADD COLUMN address TEXT;
ALTER TABLE students ADD COLUMN track TEXT;
