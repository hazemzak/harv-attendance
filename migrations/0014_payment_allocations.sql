-- Per-group split of each recorded payment, so a 'percent'-share teacher's
-- owed cut can be computed from cash ACTUALLY collected against their groups.
--
-- Why this table exists: a payment recorded via /admin/students/:id/pay settles
-- a student's whole outstanding balance, not one booking -- a student can have
-- active bookings across several teachers/groups at once, and the pay form has
-- no per-booking picker. So payments.booking_id was never populated by the real
-- app (only ever by a test's raw INSERT), which made computeTeacherOwed's
-- percent branch -- a JOIN through payments.booking_id -> bookings.group_id --
-- match zero rows and silently compute every percent teacher's owed as 0.
--
-- Allocation model: at payment-insert time, split the payment across the
-- student's currently-active, group-linked bookings PROPORTIONALLY by each
-- booking's net value (amount - discount_amount). A payment covering a 300 and
-- a 200 booking attributes 60% / 40% of whatever was paid to each booking's
-- group. Bookings with no group_id (legacy free-text) or non-positive net get
-- no share -- they can't be attributed to a teacher's group anyway.
--
-- group_id is a SNAPSHOT (no FK, no ON DELETE action) on purpose, matching this
-- codebase's attendance.teacher_name pattern: computeTeacherOwed reads straight
-- from here without joining live through bookings, so a booking later dropped or
-- a group later removed can't retroactively null out an already-collected split.
CREATE TABLE payment_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_payment_alloc_group ON payment_allocations(group_id);
