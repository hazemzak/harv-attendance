// One-time backfill CLI, companion to backfill-groups-from-legacy-schedule.mjs.
// That script gave the schedule grid (`groups`) real day/time data for 23
// teachers from the legacy `teachers.schedule` text; this one does the same
// for `teacher_availability`, which is what the PUBLIC site actually reads
// (attachSchedule()/scheduleDisplay() in src/index.js) -- without this, those
// 23 teachers show up on harvcentereg.com (roster fetch is already live) but
// with a blank schedule time, since `groups` and `teacher_availability` are
// two separate tables and nothing keeps them in sync automatically.
//
// Same source file, same mirrors-import-teachers.js pattern as the groups
// backfill -- see that script's header comment for the ESM/vitest-pool-workers
// rationale. Run once, review the report, apply by hand via
// `wrangler d1 migrations apply`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAvailabilityBackfillSql } from "./lib/build-availability-backfill-sql.mjs";

const SOURCE = "D:\\Projects Era 2.0\\002_Harvrd_DesignSystem\\data\\teachers.json";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "migrations", "seed-availability-from-legacy-schedule.sql");

function main() {
  const data = JSON.parse(fs.readFileSync(SOURCE, "utf-8"));
  const { sql, report } = buildAvailabilityBackfillSql(data.teachers);
  fs.writeFileSync(OUT, sql);
  console.log(`Wrote ${report.inserted.length} teachers' availability (${report.inserted.reduce((n, r) => n + r.slots.length, 0)} rows total) to ${OUT}`);
  console.log(`Skipped ${report.skipped.length} teachers (no parseable schedule):`);
  for (const s of report.skipped) console.log(`  - ${s.id}: ${JSON.stringify(s.schedule)} (${s.reason})`);
  console.log(`\nParsed (review before applying):`);
  for (const r of report.inserted) {
    console.log(`  - ${r.id} (${r.name}): ${JSON.stringify(r.schedule)} -> ${r.slots.map(s => `${s.day_of_week} ${s.start_time}-${s.end_time}`).join(", ")}`);
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) main();
