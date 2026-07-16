// Pure builder: turns a list of {id, name, subject, schedule} teacher
// records into the SQL that backfills real `groups` rows from their legacy
// schedule text, plus a report of what got inserted vs. skipped. No
// `fs`/`path` import -- unlike scripts/backfill-groups-from-legacy-schedule.mjs
// (the CLI entrypoint, which does the file I/O), this is independently
// unit-testable, same split already used for scripts/lib/parse-legacy-schedule.mjs.
import { parseLegacySchedule } from "./parse-legacy-schedule.mjs";

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

// Mirrors src/index.js's STAGE_TO_PHASE, inverted -- teachers.json's `phase`
// (bac2/bac3) is the only year signal these legacy rows have, so a group
// only gets a stage when the teacher's phase is set. Left NULL otherwise
// (e.g. shared-subject teachers with no single phase) rather than guessing.
const PHASE_TO_STAGE = { bac2: "تانية ثانوي", bac3: "تالتة ثانوي" };

// One statement PER TEACHER (not per slot) -- all of a teacher's slots are
// UNIONed into a single INSERT...SELECT so the WHERE NOT EXISTS guard is
// checked exactly once against the pre-insert state. This matters for the 3
// twice-weekly teachers: two separate per-slot INSERTs would have the first
// slot's own INSERT satisfy (falsify) the second slot's NOT EXISTS check --
// a real bug caught by inspecting local D1 after applying an earlier draft
// of this file, which silently dropped every twice-weekly teacher's second
// session. Grouping into one statement makes both slots insert atomically:
// either the whole teacher gets seeded, or (if they already have any groups
// row) none of it does.
export function buildBackfillSql(teachers) {
  const lines = [];
  const report = { inserted: [], skipped: [] };
  for (const t of teachers) {
    const result = parseLegacySchedule(t.schedule);
    if (result.skip) {
      report.skipped.push({ id: t.id, schedule: t.schedule, reason: result.skip });
      continue;
    }
    const seriesKey = result.slots.length > 1 ? `${t.id}-series` : null;
    const stage = PHASE_TO_STAGE[t.phase] || null;
    const selects = result.slots.map(slot =>
      `SELECT ${esc(t.id)} AS teacher_id, ${esc(t.name)} AS teacher_name, ${esc(t.subject)} AS subject, ${esc(stage)} AS stage, ${esc(slot.day_of_week)} AS day, ${esc(slot.start_time)} AS start_time, ${esc(slot.end_time)} AS end_time, NULL AS room_id, 1 AS active, ${esc(seriesKey)} AS series_key`
    ).join("\n    UNION ALL\n    ");
    lines.push(
      `INSERT INTO groups (teacher_id, teacher_name, subject, stage, day, start_time, end_time, room_id, active, series_key)\n` +
      `SELECT * FROM (\n    ${selects}\n)\n` +
      `WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = ${esc(t.id)});`
    );
    report.inserted.push({ id: t.id, name: t.name, schedule: t.schedule, slots: result.slots, seriesKey, stage });
  }
  return { sql: lines.join("\n\n") + "\n", report };
}
