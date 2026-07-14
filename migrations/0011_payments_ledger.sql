-- Real money in/out, extracted from the retired CenterStudent app's era
-- (daily income journal) and mas (expense journal by category) tables — the
-- app's #1 daily-use feature, and the biggest gap versus what's here today
-- (a computed "total booking value" is theoretical, not money actually collected).
--
-- Student balance = SUM(active bookings.amount) - SUM(bookings.discount_amount)
--                    - SUM(payments.amount for that student), always computed
--                    on read, never stored (same pattern as the booking total).
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id),
  amount REAL NOT NULL,
  method TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE INDEX idx_payments_student ON payments(student_id);

-- The center's own journal. Recording a payment auto-posts a matching
-- kind='income' row (see /admin/students/:id/pay); expenses (salaries, rent,
-- phone, cleaning, insurance — mirroring the old app's مصروف خاص/مرتبات/etc.
-- categories) are entered directly via /admin/ledger/expense.
CREATE TABLE ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  category TEXT,
  amount REAL NOT NULL,
  note TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE INDEX idx_ledger_occurred ON ledger(occurred_at);

-- Per-booking discount/voucher (covers the old app's kobon table at MVP scope —
-- a shared reusable coupon-code table is deferred until there's a real ask for it).
ALTER TABLE bookings ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN discount_note TEXT;
