-- Teacher settlement + staff roles — extracted from the retired CenterStudent
-- app's teacher_Account (per-teacher payout) and use (per-user permission
-- flags) tables. See HARV_ATTENDANCE_SUPPORT_PLAYBOOK.md Phase 4 row.
--
-- share_type/share_value: how a teacher is paid out of what students pay.
-- 'percent' = share_value% of collected payments on their groups' bookings;
-- 'per_session' = share_value EGP per attendance row logged against their groups.
ALTER TABLE teachers ADD COLUMN share_type TEXT CHECK (share_type IN ('percent', 'per_session'));
ALTER TABLE teachers ADD COLUMN share_value REAL;

-- Reuses Cloudflare Access for authentication (Cf-Access-Authenticated-User-Email
-- header, already present alongside the JWT the app already checks) — no
-- separate password system, unlike the old app's hand-rolled `use` table
-- (a crackable password string sitting in a shared file).
CREATE TABLE staff (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'clerk', 'viewer')),
  active INTEGER NOT NULL DEFAULT 1
);
