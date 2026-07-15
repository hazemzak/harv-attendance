-- Teacher payout tracking (lastPayoutFrom/computeTeacherOwed) matched ledger
-- rows to a teacher by `note LIKE '<teacher.name>%'` — two teachers sharing
-- the exact same name would cross-contaminate each other's owed/partial-payout
-- calculations (claude-review, PR #12 review round on the master-synced
-- branch). teachers.id is a stable per-teacher slug; storing it directly on
-- the ledger row removes the name-matching ambiguity entirely.
ALTER TABLE ledger ADD COLUMN teacher_id TEXT;
