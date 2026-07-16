import { describe, it, expect } from "vitest";
import { parseLegacySchedule } from "./parse-legacy-schedule.mjs";

// Every case below is a REAL verbatim string from data/teachers.json (see
// HARV_ATTENDANCE_SUPPORT_PLAYBOOK.md's 2026-07-17 row), not invented data --
// the whole point of this parser is to handle exactly what's actually there.
describe("parseLegacySchedule", () => {
  it("parses a simple single day/time slot", () => {
    expect(parseLegacySchedule("الأربعاء 5–7 مساءً")).toEqual({
      slots: [{ day_of_week: "wed", start_time: "17:00", end_time: "19:00" }]
    });
  });

  it("parses ظهرًا as a PM-base period word", () => {
    expect(parseLegacySchedule("الأحد 1–2:30 ظهرًا")).toEqual({
      slots: [{ day_of_week: "sun", start_time: "13:00", end_time: "14:30" }]
    });
  });

  it("parses عصرًا with a half-hour start", () => {
    expect(parseLegacySchedule("السبت 1:30–7 عصرًا")).toEqual({
      slots: [{ day_of_week: "sat", start_time: "13:30", end_time: "19:00" }]
    });
  });

  it("cross-noon fix: صباحًا range that actually crosses noon (real ambiguous case)", () => {
    expect(parseLegacySchedule("السبت 10–1 صباحًا")).toEqual({
      slots: [{ day_of_week: "sat", start_time: "10:00", end_time: "13:00" }]
    });
  });

  it("keeps a صباحًا range that doesn't cross noon as-is", () => {
    expect(parseLegacySchedule("الخميس 9–12 صباحًا")).toEqual({
      slots: [{ day_of_week: "thu", start_time: "09:00", end_time: "12:00" }]
    });
  });

  it("parses two slots joined by the U+00B7 separator", () => {
    expect(parseLegacySchedule("الاثنين 3–5 مساءً · الأربعاء 3–5 عصرًا")).toEqual({
      slots: [
        { day_of_week: "mon", start_time: "15:00", end_time: "17:00" },
        { day_of_week: "wed", start_time: "15:00", end_time: "17:00" }
      ]
    });
  });

  it("skips the 'أونلاين' sentinel (no real time to parse) rather than guessing", () => {
    const result = parseLegacySchedule("أونلاين");
    expect(result).toHaveProperty("skip");
    expect(result).not.toHaveProperty("slots");
  });

  it("skips null/empty rather than guessing", () => {
    expect(parseLegacySchedule(null)).toHaveProperty("skip");
    expect(parseLegacySchedule("")).toHaveProperty("skip");
    expect(parseLegacySchedule("   ")).toHaveProperty("skip");
  });

  it("skips an unrecognized shape rather than guessing", () => {
    expect(parseLegacySchedule("يوم غريب 5-7")).toHaveProperty("skip");
    expect(parseLegacySchedule("الأربعاء بدون وقت")).toHaveProperty("skip");
  });
});
