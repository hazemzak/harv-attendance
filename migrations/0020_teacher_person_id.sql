-- Additive: person_id groups rows that are the same real teacher across
-- multiple subjects (e.g. a Thanaweya math teacher who also teaches
-- Bakaloreya statistics) purely for display merging in /admin/teachers.
-- Deliberately not a person+assignments table rebuild -- see the
-- teacher-roster-rework council verdict (/council, 2026-07-16): at 4 known
-- pairs out of 56 rows, a full identity model would re-point every existing
-- FK (ledger.teacher_id, teacher_availability.teacher_id, bookings) for a
-- scale this app doesn't have. person_id is NULL for every standalone
-- teacher (the vast majority) -- NULL means "no grouping", not "no person".
ALTER TABLE teachers ADD COLUMN person_id TEXT;

-- The 4 real duplicate pairs, hardcoded -- known, fixed data, not worth a
-- generic name-matching backfill for 4 rows.
UPDATE teachers SET person_id = 'sherbini' WHERE id IN ('sherbini', 'sherbini-statistics');
UPDATE teachers SET person_id = 'mazen' WHERE id IN ('mazen', 'mazen-statistics');
UPDATE teachers SET person_id = 'magd' WHERE id IN ('magd', 'magd-statistics');
UPDATE teachers SET person_id = 'mohamed-naguib' WHERE id IN ('mohamed-naguib', 'mohamed-naguib-statistics');

-- One-time cleanup: subject_label drifted inconsistent per row for legacy
-- imported teachers (some rows got an English label, some an Arabic one,
-- for the exact same subject -- e.g. "Math" vs "الرياضيات") -- this is what
-- read as "Math and رياضيات aren't treated as the same subject" on the
-- public site, which renders subject_label as free display text.
-- /admin/teachers's own section grouping was never affected (it groups by
-- the canonical `subject` slug, not this label). Normalized to match
-- subjectLabelFor()'s output in src/index.js -- the same value any current
-- or future teacher create/edit already writes, so this is a one-time catch-up,
-- not a new convention.
UPDATE teachers SET subject_label = 'رياضيات' WHERE subject = 'math';
UPDATE teachers SET subject_label = 'فيزياء' WHERE subject = 'physics';
UPDATE teachers SET subject_label = 'كيمياء' WHERE subject = 'chemistry';
UPDATE teachers SET subject_label = 'أحياء' WHERE subject = 'biology';
UPDATE teachers SET subject_label = 'محاسبة' WHERE subject = 'accounting';
