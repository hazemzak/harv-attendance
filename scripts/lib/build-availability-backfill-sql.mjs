// Companion to build-backfill-sql.mjs (which backfills `groups` for the
// schedule grid) -- this backfills `teacher_availability` from the same
// legacy `teachers.schedule` text, for the same 23 teachers, so the public
// site's attachSchedule()/scheduleDisplay() (which reads teacher_availability,
// never `groups`) shows their real class time too instead of staying blank.
// Same WHERE-NOT-EXISTS-per-teacher guard as the groups backfill: never
// touches a teacher who already has any teacher_availability row.
import { parseLegacySchedule } from "./parse-legacy-schedule.mjs";

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

export function buildAvailabilityBackfillSql(teachers) {
  const lines = [];
  const report = { inserted: [], skipped: [] };
  for (const t of teachers) {
    const result = parseLegacySchedule(t.schedule);
    if (result.skip) {
      report.skipped.push({ id: t.id, schedule: t.schedule, reason: result.skip });
      continue;
    }
    const selects = result.slots.map(slot =>
      `SELECT ${esc(t.id)} AS teacher_id, ${esc(slot.day_of_week)} AS day_of_week, ${esc(slot.start_time)} AS start_time, ${esc(slot.end_time)} AS end_time, NULL AS room_id`
    ).join("\n    UNION ALL\n    ");
    lines.push(
      `INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)\n` +
      `SELECT * FROM (\n    ${selects}\n)\n` +
      `WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = ${esc(t.id)});`
    );
    report.inserted.push({ id: t.id, name: t.name, schedule: t.schedule, slots: result.slots });
  }
  return { sql: lines.join("\n\n") + "\n", report };
}
