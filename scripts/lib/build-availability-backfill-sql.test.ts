import { describe, it, expect } from "vitest";
import { buildAvailabilityBackfillSql } from "./build-availability-backfill-sql.mjs";

describe("buildAvailabilityBackfillSql", () => {
  it("emits one WHERE-NOT-EXISTS-guarded INSERT per teacher, room_id left NULL", () => {
    const { sql, report } = buildAvailabilityBackfillSql([
      { id: "t1", name: "أ. واحد", schedule: "الأربعاء 5–7 مساءً" }
    ]);
    expect(sql).toContain("SELECT 't1' AS teacher_id, 'wed' AS day_of_week, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id");
    expect(sql).toContain("WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 't1')");
    expect(report.inserted).toEqual([{ id: "t1", name: "أ. واحد", schedule: "الأربعاء 5–7 مساءً", slots: [{ day_of_week: "wed", start_time: "17:00", end_time: "19:00" }] }]);
  });

  it("a twice-weekly teacher's two slots go into ONE INSERT statement (UNION ALL)", () => {
    const { sql, report } = buildAvailabilityBackfillSql([
      { id: "t2", name: "أ. اتنين", schedule: "الاثنين 3–5 مساءً · الأربعاء 3–5 عصرًا" }
    ]);
    const insertCount = (sql.match(/^INSERT INTO teacher_availability/gm) || []).length;
    expect(insertCount).toBe(1);
    expect(sql).toContain("UNION ALL");
    expect(report.inserted[0].slots.length).toBe(2);
  });

  it("skips a teacher with no parseable schedule and reports why", () => {
    const { sql, report } = buildAvailabilityBackfillSql([
      { id: "t3", name: "أ. أونلاين", schedule: "أونلاين" },
      { id: "t4", name: "أ. بدون جدول", schedule: null }
    ]);
    expect(sql).not.toContain("t3");
    expect(sql).not.toContain("t4");
    expect(report.skipped.map(s => s.id)).toEqual(["t3", "t4"]);
    expect(report.inserted).toEqual([]);
  });
});
