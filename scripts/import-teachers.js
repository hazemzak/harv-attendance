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

const data = JSON.parse(fs.readFileSync(SOURCE, "utf-8"));
const lines = ["DELETE FROM teachers;"];
for (const t of data.teachers) {
  lines.push(
    `INSERT INTO teachers (id, name, subject, subject_label, phase, mode, schedule, track) VALUES (${esc(t.id)}, ${esc(t.name)}, ${esc(t.subject)}, ${esc(t.subjectLabel)}, ${esc(t.phase)}, ${esc(t.mode)}, ${esc(t.schedule)}, ${esc(t.track)});`
  );
}
fs.writeFileSync(OUT, lines.join("\n") + "\n");
console.log(`Wrote ${data.teachers.length} teachers to ${OUT}`);
