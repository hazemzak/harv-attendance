-- groups.time was free text ('5PM'); a scheduling grid needs 24h HH:MM plus
-- an end time. Zero rows in production (confirmed before writing this), so a
-- plain rename+add is safe -- no backfill needed. `day` keeps its column
-- name (already documented as the DAYS_OF_WEEK slug-holder, just never
-- enforced until now).
ALTER TABLE groups RENAME COLUMN time TO start_time;
ALTER TABLE groups ADD COLUMN end_time TEXT;
