-- Additive: a retired teacher is never deleted -- their row stays forever
-- so money/settlement/payout history never breaks and they can return.
-- retired_at IS NOT NULL is the only invariant: excluded from every
-- future-write path (scheduling, /register's picker, /admin/groups'
-- teacher select), always included in historical/money reads (ledger,
-- settlement, payout history, past bookings) since those never filter by
-- this column. Retiring is always an explicit owner action (confirmed with
-- Hazem, teacher-roster-rework council/plan, 2026-07-16) -- never automatic
-- off a "no active schedule" signal, which stays a passive hint only.
ALTER TABLE teachers ADD COLUMN retired_at TEXT;
