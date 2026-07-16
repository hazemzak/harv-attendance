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
// actually owns. photo_blob/photo_blob_type/person_id/retired_at/share_*
// are never referenced here, so they're untouched by construction.
//
// Every other admin-editable column (name/subject/subject_label/phase/
// mode/track — see POST /admin/teachers/:id in src/index.js) is guarded
// the same way as photo: a re-import never overwrites a field on a row
// the app has touched. `photo_blob IS NOT NULL` is the only "this row was
// edited in the app" signal that exists today (claude-review flagged the
// original version of this fix for only guarding `photo` and leaving the
// same clobber risk on every other field a text-only admin edit changes —
// real finding, this is the fix) — it's an imperfect proxy (a text-only
// edit before any photo is ever uploaded isn't caught), but it's strictly
// better than the pre-fix behavior of always overwriting, and Phase 2/3's
// person_id/retired_at columns (teacher-roster-rework plan) are the
// planned proper authorship marker this can move onto. `name` is included
// here too since the dedicated rename endpoint (Phase 4) hasn't shipped
// yet — the regular edit form can still change it today.
// ponytail: schedule is deliberately unguarded/still overwritten — it's
// not touched by any admin route (superseded by teacher_availability),
// so re-import can't clobber an app edit that never happens.
function buildUpsertSql(teachers) {
  const guarded = col => `CASE WHEN teachers.photo_blob IS NULL THEN excluded.${col} ELSE teachers.${col} END`;
  const lines = [];
  for (const t of teachers) {
    lines.push(
      `INSERT INTO teachers (id, name, subject, subject_label, phase, mode, schedule, track, photo) VALUES (${esc(t.id)}, ${esc(t.name)}, ${esc(t.subject)}, ${esc(t.subjectLabel)}, ${esc(t.phase)}, ${esc(t.mode)}, ${esc(t.schedule)}, ${esc(t.track)}, ${esc(t.photo)}) ON CONFLICT(id) DO UPDATE SET name=${guarded("name")}, subject=${guarded("subject")}, subject_label=${guarded("subject_label")}, phase=${guarded("phase")}, mode=${guarded("mode")}, schedule=excluded.schedule, track=${guarded("track")}, photo=${guarded("photo")};`
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
