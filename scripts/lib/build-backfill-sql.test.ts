import { describe, it, expect } from "vitest";
import { buildBackfillSql } from "./build-backfill-sql.mjs";

describe("buildBackfillSql", () => {
  it("emits one WHERE-NOT-EXISTS-guarded INSERT per teacher, room_id/capacity/price left out (NULL by omission)", () => {
    const { sql, report } = buildBackfillSql([
      { id: "t1", name: "أ. واحد", subject: "math", schedule: "الأربعاء 5–7 مساءً" }
    ]);
    expect(sql).toContain("SELECT 't1' AS teacher_id, 'أ. واحد' AS teacher_name, 'math' AS subject, 'wed' AS day, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key");
    expect(sql).toContain("WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 't1')");
    expect(report.inserted).toEqual([{ id: "t1", name: "أ. واحد", schedule: "الأربعاء 5–7 مساءً", slots: [{ day_of_week: "wed", start_time: "17:00", end_time: "19:00" }], seriesKey: null }]);
    expect(report.skipped).toEqual([]);
  });

  it("regression: a twice-weekly teacher's two slots go into ONE INSERT statement (UNION ALL), not two separate ones -- two separate INSERTs would have the first slot's own row satisfy (falsify) the second slot's own NOT EXISTS check and silently drop it", () => {
    const { sql, report } = buildBackfillSql([
      { id: "t2", name: "أ. اتنين", subject: "physics", schedule: "الاثنين 3–5 مساءً · الأربعاء 3–5 عصرًا" }
    ]);
    const insertCount = (sql.match(/^INSERT INTO groups/gm) || []).length;
    expect(insertCount).toBe(1); // one statement covering both slots, not one per slot
    expect(sql).toContain("UNION ALL");
    const matches = [...sql.matchAll(/'t2-series'/g)];
    expect(matches.length).toBe(2); // both slots share the same series_key
    expect(report.inserted[0].seriesKey).toBe("t2-series");
    expect(report.inserted[0].slots.length).toBe(2);
  });

  it("skips a teacher with no parseable schedule and reports why, emitting no SQL for them", () => {
    const { sql, report } = buildBackfillSql([
      { id: "t3", name: "أ. أونلاين", subject: "math", schedule: "أونلاين" },
      { id: "t4", name: "أ. بدون جدول", subject: "math", schedule: null }
    ]);
    expect(sql).not.toContain("t3");
    expect(sql).not.toContain("t4");
    expect(report.skipped.map(s => s.id)).toEqual(["t3", "t4"]);
    expect(report.inserted).toEqual([]);
  });

  it("does not guess a subject/name that isn't in the source row", () => {
    const { sql } = buildBackfillSql([
      { id: "t5", name: "أ. خمسة", subject: "chemistry", schedule: "السبت 4–6 مساءً" }
    ]);
    expect(sql).toContain("'chemistry'");
    expect(sql).toContain("'أ. خمسة'");
  });
});
