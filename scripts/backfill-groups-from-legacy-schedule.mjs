// One-time backfill CLI: turns real day/time data already sitting in the
// legacy free-text teachers.schedule field (data/teachers.json, pre-dates
// the 2026-07-16 structured teacher_availability system) into real `groups`
// rows -- so those teachers show up on /admin/schedule?hall=general (flagged
// "needs a hall") instead of staff having to re-type timing that's already
// known. See HARV_ATTENDANCE_SUPPORT_PLAYBOOK.md's 2026-07-17 row for the
// full design rationale (money-safety check, why room_id/capacity/price are
// left NULL, why series_key exists for twice-weekly teachers).
//
// Mirrors scripts/import-teachers.js's pattern: reads the same source file,
// writes a checked-in SQL artifact under migrations/, applied by hand via
// `wrangler d1 execute`. Unlike import-teachers.js this isn't a recurring
// sync -- run it once, review the report, apply.
//
// The actual SQL-building logic lives in scripts/lib/build-backfill-sql.mjs
// (no fs/DB import there, kept independently unit-testable) -- this file is
// just the fs-touching CLI wrapper around it. ESM (`.mjs`, not `.js` like
// import-teachers.js) so it can statically `import` that lib file -- a
// nested `require()` between local files doesn't resolve inside the
// vitest-pool-workers sandbox used to unit-test the lib files, even though
// it works fine in plain Node; ESM sidesteps that entirely.
//
// ponytail: hardcoded absolute source path, same as import-teachers.js --
// this only ever runs on this machine by hand.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildBackfillSql } from "./lib/build-backfill-sql.mjs";

const SOURCE = "D:\\Projects Era 2.0\\002_Harvrd_DesignSystem\\data\\teachers.json";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "migrations", "seed-groups-from-legacy-schedule.sql");

function main() {
  const data = JSON.parse(fs.readFileSync(SOURCE, "utf-8"));
  const { sql, report } = buildBackfillSql(data.teachers);
  fs.writeFileSync(OUT, sql);
  console.log(`Wrote ${report.inserted.length} teachers' groups (${report.inserted.reduce((n, r) => n + r.slots.length, 0)} rows total) to ${OUT}`);
  console.log(`Skipped ${report.skipped.length} teachers (no parseable schedule):`);
  for (const s of report.skipped) console.log(`  - ${s.id}: ${JSON.stringify(s.schedule)} (${s.reason})`);
  console.log(`\nParsed (review before applying):`);
  for (const r of report.inserted) {
    const weekly = r.seriesKey ? ` [x${r.slots.length}/week, series_key=${r.seriesKey}]` : "";
    console.log(`  - ${r.id} (${r.name}): ${JSON.stringify(r.schedule)} -> ${r.slots.map(s => `${s.day_of_week} ${s.start_time}-${s.end_time}`).join(", ")}${weekly}`);
  }
}

// ESM equivalent of CJS's `require.main === module` entrypoint check.
if (fileURLToPath(import.meta.url) === process.argv[1]) main();
