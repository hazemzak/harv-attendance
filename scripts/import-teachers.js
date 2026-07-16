// Regenerates migrations/seed-teachers.sql from the design-system repo's
// data/teachers.json (the trusted roster source of truth). Run this, then
// apply the generated file with wrangler d1 execute, whenever the roster
// changes — this is a manual one-off sync, not a live/automatic pipeline.
//
// ponytail: hardcoded absolute path — this only ever runs on this machine
// (PC-2 path differs, see the two-PC Syncthing setup); not worth a config
// flag for a script one person runs by hand.
const fs = require("fs");
const path = require("path");

const SOURCE = "D:\\Projects Era 2.0\\002_Harvrd_DesignSystem\\data\\teachers.json";
const OUT = path.join(__dirname, "..", "migrations", "seed-teachers.sql");

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

// Upsert, not DELETE+reinsert (fixed 2026-07-16 — the old DELETE FROM
// teachers; wiped every app-added teacher (ids not in teachers.json) and
// every photo_blob on every run, confirmed as an active data-loss bug, not
// hypothetical). ON CONFLICT only touches the columns this source file
// actually owns; photo is guarded so a teacher re-photographed in the app
// (photo_blob set) never gets reverted to the stale disk path. photo_blob/
// photo_blob_type/person_id/retired_at/share_* are never referenced here,
// so they're untouched by construction, not by omission-that-could-drift.
function buildUpsertSql(teachers) {
  const lines = [];
  for (const t of teachers) {
    lines.push(
      `INSERT INTO teachers (id, name, subject, subject_label, phase, mode, schedule, track, photo) VALUES (${esc(t.id)}, ${esc(t.name)}, ${esc(t.subject)}, ${esc(t.subjectLabel)}, ${esc(t.phase)}, ${esc(t.mode)}, ${esc(t.schedule)}, ${esc(t.track)}, ${esc(t.photo)}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, subject=excluded.subject, subject_label=excluded.subject_label, phase=excluded.phase, mode=excluded.mode, schedule=excluded.schedule, track=excluded.track, photo=CASE WHEN teachers.photo_blob IS NULL THEN excluded.photo ELSE teachers.photo END;`
    );
  }
  return lines.join("\n") + "\n";
}

if (require.main === module) {
  const data = JSON.parse(fs.readFileSync(SOURCE, "utf-8"));
  const sql = buildUpsertSql(data.teachers);
  fs.writeFileSync(OUT, sql);
  console.log(`Wrote ${data.teachers.length} teachers to ${OUT}`);
}

module.exports = { buildUpsertSql };
