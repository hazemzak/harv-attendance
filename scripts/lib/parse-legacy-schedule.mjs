// Pure parser for the legacy free-text `teachers.schedule` field (e.g.
// "الأربعاء 5–7 مساءً"). Deliberately no `fs`/DB import -- unlike
// scripts/import-teachers.js (which does `require("fs")` at module load and
// can't be imported into the Workers test env), this file is a plain
// function that can be unit-tested directly. ESM (`.mjs`) specifically so
// static `import` resolves correctly across a multi-file chain inside the
// vitest-pool-workers sandbox -- a nested CJS `require()` between local
// files doesn't resolve there even though it works fine in plain Node.
//
// Format confirmed against the real data/teachers.json source (56 teachers,
// 36 with non-null schedule): "<day-name> <start>–<end> <period-word>",
// optionally two slots joined by " · " (U+00B7, not a plain "."). Anything
// that doesn't match this exact shape -- including "أونلاين" (online, no
// real time) and null/empty -- is skipped and reported. Never guess: a wrong
// parse would create a real groups row with a wrong day/time, which is worse
// than leaving that teacher for staff to set up manually.

// Duplicated from src/index.js's DAYS_OF_WEEK (357-365) -- this is a
// standalone Node script, not bundled into the Worker, same reasoning
// scripts/import-teachers.js already uses for its own small duplicated
// lookups. Keep the .ar values in sync with DAYS_OF_WEEK if that list ever
// changes.
const DAY_NAME_TO_SLUG = {
  "السبت": "sat", "الأحد": "sun", "الاثنين": "mon", "الثلاثاء": "tue",
  "الأربعاء": "wed", "الخميس": "thu", "الجمعة": "fri"
};

// مساءً (evening) / عصرًا (afternoon) / ظهرًا (noon, used loosely for early
// afternoon in the real data) all read as "PM-base": add 12 unless the hour
// is already 12. صباحًا (morning) reads as "AM-base": hour stays as written,
// 12 stays 12 (noon).
const PM_WORDS = new Set(["مساءً", "عصرًا", "ظهرًا"]);
const AM_WORDS = new Set(["صباحًا"]);

// Matches this app's own business-hours bound (BUSINESS_OPEN/BUSINESS_CLOSE,
// src/index.js:373) -- duplicated for the same standalone-script reason as
// DAY_NAME_TO_SLUG above. A parsed time outside this range means the parse
// itself is almost certainly wrong, not a real school hour.
const BUSINESS_OPEN = "07:00";
const BUSINESS_CLOSE = "23:59";

function to24h(hour, minute, isPM) {
  let h = hour;
  if (isPM && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// "H" or "H:MM", 1-12 hour (this format is always 12h).
function parseHourMinute(str) {
  const m = str.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return { hour, minute };
}

function parseOneSlot(slot) {
  const parts = slot.trim().split(/\s+/);
  if (parts.length < 3) return { skip: `unexpected shape: "${slot}"` };
  const dayWord = parts[0];
  const periodWord = parts[parts.length - 1];
  const rangeStr = parts.slice(1, -1).join(" ");
  const day = DAY_NAME_TO_SLUG[dayWord];
  if (!day) return { skip: `unknown day word: "${dayWord}"` };
  const isPM = PM_WORDS.has(periodWord);
  const isAM = AM_WORDS.has(periodWord);
  if (!isPM && !isAM) return { skip: `unknown period word: "${periodWord}"` };
  // en-dash (–, U+2013) is the real separator in the source data; also
  // tolerate a plain hyphen in case a future entry uses one.
  const rangeParts = rangeStr.split(/[–-]/);
  if (rangeParts.length !== 2) return { skip: `unexpected time range: "${rangeStr}"` };
  const start = parseHourMinute(rangeParts[0]);
  const end = parseHourMinute(rangeParts[1]);
  if (!start || !end) return { skip: `unparseable time: "${rangeStr}"` };
  const startTime = to24h(start.hour, start.minute, isPM);
  let endTime = to24h(end.hour, end.minute, isPM);
  // Cross-noon fix: a real example in the source data, "10–1 صباحًا", means
  // 10am→1pm even though the word is "morning" -- an AM-base range whose end
  // comes out earlier than its start has actually crossed noon.
  if (isAM && endTime <= startTime) {
    endTime = to24h(end.hour, end.minute, true);
  }
  if (endTime <= startTime) return { skip: `end time not after start: "${slot}"` };
  if (startTime < BUSINESS_OPEN || endTime > BUSINESS_CLOSE) {
    return { skip: `outside business hours: "${slot}" -> ${startTime}-${endTime}` };
  }
  return { day_of_week: day, start_time: startTime, end_time: endTime };
}

export function parseLegacySchedule(text) {
  if (!text || typeof text !== "string") return { skip: "empty/missing" };
  const trimmed = text.trim();
  if (!trimmed) return { skip: "empty" };
  const slotStrings = trimmed.split(/\s*·\s*/).filter(Boolean);
  const slots = [];
  for (const s of slotStrings) {
    const result = parseOneSlot(s);
    if (result.skip) return { skip: result.skip };
    slots.push(result);
  }
  if (!slots.length) return { skip: "no slots parsed" };
  return { slots };
}

export { DAY_NAME_TO_SLUG };
