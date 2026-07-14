import qrcode from "qrcode-generator";

const LOGO_B64 = "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";

// Slimmed 2026-07-13 per the /council IA verdict (role-first, then time):
// staff only ever see home(intake)/session/guide; إدارة(owner) only renders
// when isOwner is true. The old flat 9-item bar (students/today/print/
// estamarat/groups/promos/counter) moved into the intake/session hub pages
// as contextual links instead of top-level nav — those routes are unchanged,
// just no longer all equally weighted in the nav.
const NAV_I18N = {
  ar: { home: "🏠 الرئيسية", session: "▶️ أثناء الحصة", owner: "⚙️ إدارة", guide: "📖 دليل الموظفين", brand: "هارف · تسجيل الحضور" },
  en: { home: "🏠 Home", session: "▶️ In Session", owner: "⚙️ Management", guide: "📖 Staff Guide", brand: "Harv · Attendance" }
};

function langOf(url) {
  return url.searchParams.get("lang") === "en" ? "en" : "ar";
}

function toggleHref(url, lang) {
  const u = new URL(url.toString());
  u.searchParams.set("lang", lang === "en" ? "ar" : "en");
  const qs = u.searchParams.toString();
  return u.pathname + (qs ? "?" + qs : "");
}

function page(title, body, { nav = true, lang = "ar", toggleHref: toggle = null, isOwner = false } = {}) {
  const dir = lang === "en" ? "ltr" : "rtl";
  const n = NAV_I18N[lang];
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#D42027">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon.png">
<title>${title} · Harv</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --red:#D42027; --ink:#1A2744; --paper:#FAFAF8; --surface:#FFFFFF;
  --line:#E5E7EB; --line-soft:#F3F4F6; --success:#1F9D6B; --success-bg:#E2F5EC;
}
*{box-sizing:border-box}
html,body{margin:0;font-family:'Cairo',ui-sans-serif,system-ui,sans-serif;color:var(--ink);background:var(--paper);font-size:18px;line-height:1.5}
.wrap{max-width:640px;margin:0 auto;padding:0 20px 40px}
header{display:flex;align-items:center;gap:14px;padding:20px 0;border-bottom:3px solid var(--red);margin-bottom:24px}
header img{height:48px;width:auto;display:block}
header .brand{font-size:20px;font-weight:700;color:var(--ink)}
nav{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
nav a{
  display:inline-block;padding:14px 20px;border-radius:999px;background:var(--surface);
  border:2px solid var(--line);color:var(--ink);text-decoration:none;font-weight:600;font-size:16px;
}
nav a:hover{border-color:var(--red)}
h1{font-size:26px;font-weight:700;margin:0 0 20px}
.card{
  background:var(--surface);border:1px solid var(--line);border-radius:14px;
  padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:16px;
}
.card svg{width:84px;height:84px;flex-shrink:0}
.card strong{font-size:19px}
.card small{color:#5A6784}
form{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px;margin-bottom:20px}
label{display:block;font-weight:600;margin-bottom:8px;font-size:16px}
input{
  width:100%;font-size:18px;padding:14px 16px;margin-bottom:16px;
  border:2px solid var(--line);border-radius:10px;font-family:inherit;
}
input:focus{outline:none;border-color:var(--red)}
button{
  width:100%;font-size:19px;font-weight:700;padding:16px;
  background:var(--red);color:#fff;border:none;border-radius:999px;cursor:pointer;font-family:inherit;
}
button:active{background:#B91C1C}
.help-fab{
  position:fixed;bottom:20px;inset-inline-end:20px;z-index:50;
  width:52px;height:52px;border-radius:999px;background:var(--red);color:#fff;
  display:flex;align-items:center;justify-content:center;font-size:24px;
  text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25);
}
.confirm{
  background:var(--success-bg);border:2px solid var(--success);border-radius:16px;
  padding:28px 20px;text-align:center;font-size:20px;
}
.confirm strong{display:block;font-size:26px;margin-bottom:8px;color:var(--ink)}
.empty{color:#5A6784;padding:20px 0}
.pending-card{border:2px solid var(--red);background:#FFF5F5}
.badge-pending{display:inline-block;background:var(--red);color:#fff;font-size:13px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:8px}
.pending-photo{width:64px;height:64px;border-radius:10px;object-fit:cover;flex-shrink:0}
.pending-actions{display:flex;gap:8px;margin-top:10px}
.pending-actions button{width:auto;padding:10px 18px;font-size:15px}
.btn-reject{background:#fff!important;color:var(--red)!important;border:2px solid var(--red)!important}
.reg-link{background:var(--surface);border:1px dashed var(--line);border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:15px;word-break:break-all}
.reg-link a{color:var(--red);font-weight:700}
select{
  width:100%;font-size:18px;padding:14px 16px;margin-bottom:16px;
  border:2px solid var(--line);border-radius:10px;font-family:inherit;background:#fff;
}
.lang-switch{margin-inline-start:auto;font-size:14px;font-weight:600;color:var(--ink);text-decoration:underline;white-space:nowrap}
.card.stripe-a{background:#F3F4F6}
.card.stripe-b{background:#E2E4E9}
.subjects-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.subject-chip{display:flex;align-items:center;gap:6px;background:#fff;border:2px solid var(--line);border-radius:999px;padding:8px 14px;font-size:15px;cursor:pointer}
.subject-chip input{width:auto;margin:0}
.pay-options{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.pay-option{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid var(--line);border-radius:12px;padding:14px 16px;font-size:16px;cursor:pointer}
.pay-option input{width:auto;margin:0}
.pay-hint{font-size:13px;color:#5A6784;margin-inline-start:auto}
.badge-paid{display:inline-block;background:var(--success);color:#fff;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px}
.teacher-ref-panel{background:#F8F9FB;border:3px solid var(--ink);border-radius:16px;padding:20px;margin-bottom:22px}
.teacher-ref-panel > h2{font-size:20px!important}
.teacher-subject-block{margin-bottom:22px}
.teacher-subject-block:last-child{margin-bottom:0}
.teacher-subject-block h3{font-size:20px;margin:0 0 10px;color:var(--red);font-weight:800}
.pick-hint{font-size:14px;color:#5A6784;margin:0 0 14px}
.pick-skip-note{font-size:14px;color:#5A6784;margin:2px 0 0}
.teacher-pick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.teacher-card{background:#fff;border:2px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:0;display:flex;align-items:center;gap:12px}
.teacher-card--pick{cursor:pointer;position:relative}
.teacher-card--pick input{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer}
.teacher-card--pick:hover{border-color:var(--red)}
.teacher-card--pick:has(input:checked){border-color:var(--red);background:#FFF5F5;box-shadow:0 0 0 2px var(--red) inset}
.t-photo{width:52px;height:52px;border-radius:999px;object-fit:cover;flex:none;background:var(--line-soft)}
.t-photo--empty{display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#5A6784}
.t-info{min-width:0}
.teacher-card .t-name{font-size:17px;font-weight:700;color:var(--ink)}
.teacher-card .t-phase{font-size:13px;font-weight:600;color:#5A6784}
.teacher-card .t-schedule{font-size:17px;font-weight:800;color:var(--red);margin-top:4px;line-height:1.35}
.mode-badge{display:inline-block;margin-top:10px;padding:6px 14px;border-radius:999px;font-size:15px;font-weight:700}
.mode-online{background:#E3F2FD;color:#1565C0}
.mode-center{background:#E2F5EC;color:#1F9D6B}
.mode-both{background:#F3E8FF;color:#7C3AED}
.mode-other{background:var(--line-soft);color:#5A6784}
.promo-box{background:#FFF8E1;border:2px solid #F0C929;border-radius:12px;padding:14px 16px;margin-top:12px;font-size:16px;line-height:1.8}
.print-ticket{background:#fff;border:2px solid var(--line);border-radius:16px;padding:28px 20px;text-align:center;max-width:340px;margin:0 auto 20px}
.print-ticket svg{width:200px;height:200px;margin:12px auto;display:block}
.print-ticket .pt-name{font-size:23px;font-weight:700}
.print-ticket .pt-class{font-size:16px;color:#5A6784;margin-top:4px}
.print-ticket .pt-hint{font-size:14px;color:#5A6784;margin-top:14px;line-height:1.6}
.handoff-actions{display:flex;flex-direction:column;gap:12px;max-width:340px;margin:0 auto 20px}
.wa-btn{background:#25D366!important}
.stat-tiles{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px}
.stat-tile{flex:1 1 130px;background:var(--surface);border:2px solid var(--line);border-radius:14px;padding:16px;text-align:center}
.stat-tile .stat-num{font-size:28px;font-weight:800;color:var(--red)}
.stat-tile .stat-label{font-size:14px;color:#5A6784;margin-top:4px}
.dash-sections{display:flex;flex-direction:column;gap:16px}
.dash-card{background:var(--surface);border:2px solid var(--ink);border-radius:16px;padding:20px}
.dash-card h2{margin:0 0 12px;font-size:21px}
.dash-card summary{margin:0;font-size:21px;font-weight:700;cursor:pointer}
.dash-card[open] summary{margin-bottom:12px}
.hint-banner{background:#FFF8E6;border:2px dashed var(--line);border-radius:14px;padding:14px 18px;font-size:15px;line-height:1.7;margin:0 0 16px}
.dash-card .dash-links{display:flex;flex-wrap:wrap;gap:10px}
.dash-card .dash-links a{
  display:inline-block;padding:12px 18px;border-radius:999px;background:#fff;
  border:2px solid var(--line);color:var(--ink);text-decoration:none;font-weight:600;
}
.dash-card .dash-links a:hover{border-color:var(--red)}
.booking-table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:14px}
.booking-table th,.booking-table td{border:1px solid var(--line);padding:6px}
.booking-table input,.booking-table select{margin:0;padding:8px;font-size:14px}
.booking-table tfoot td{font-weight:800;font-size:16px}
.estamara-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.estamara-total{font-size:22px;font-weight:800;color:var(--red);text-align:end;margin-top:10px}
@media print{
  header,nav,.no-print{display:none}
  body{font-size:14px}
  .roster-table{border-collapse:collapse;width:100%}
  .roster-table th,.roster-table td{border:1px solid #000;padding:8px 10px;text-align:right}
  .roster-box{width:26px;height:26px;border:2px solid #000;display:inline-block}
  .booking-table th,.booking-table td{border:1px solid #000}
}
</style></head><body>
<div class="wrap">
<header>
<a href="/${lang === "en" ? "?lang=en" : ""}" style="display:flex;align-items:center;gap:14px;text-decoration:none">
${LOGO_B64 ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Harv">` : ""}
<span class="brand">${n.brand}</span>
</a>
${toggle ? `<a class="lang-switch" href="${toggle}">${lang === "en" ? "العربية" : "English"}</a>` : ""}
</header>
${nav ? `<nav><a href="/admin/intake${lang === "en" ? "?lang=en" : ""}">${n.home}</a><a href="/admin/session${lang === "en" ? "?lang=en" : ""}">${n.session}</a>${isOwner ? `<a href="/admin/owner${lang === "en" ? "?lang=en" : ""}">${n.owner}</a>` : ""}<a href="/admin/guide">${n.guide}</a></nav>` : ""}
<h1>${title}</h1>
${body}
</div>
${nav ? `<a class="help-fab no-print" href="/admin/guide" title="${lang === "en" ? "Help" : "مساعدة"}">❓</a>` : ""}
</body></html>`;
}

function qrSvg(text) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2 });
}

const SUBJECTS = [
  { v: "arabic", ar: "عربي", en: "Arabic" },
  { v: "english", ar: "إنجليزي", en: "English" },
  { v: "french", ar: "فرنساوي", en: "French" },
  { v: "german", ar: "ألماني", en: "German" },
  { v: "italian", ar: "إيطالي", en: "Italian" },
  { v: "math", ar: "رياضيات", en: "Math" },
  { v: "physics", ar: "فيزياء", en: "Physics" },
  { v: "chemistry", ar: "كيمياء", en: "Chemistry" },
  { v: "biology", ar: "أحياء", en: "Biology" },
  { v: "geology", ar: "جيولوجيا", en: "Geology" },
  { v: "statistics", ar: "إحصاء", en: "Statistics" },
  { v: "history", ar: "تاريخ", en: "History" },
  { v: "geography", ar: "جغرافيا", en: "Geography" },
  { v: "philosophy", ar: "فلسفة", en: "Philosophy" },
  { v: "accounting", ar: "محاسبة", en: "Accounting" },
  { v: "business", ar: "إدارة أعمال", en: "Business" },
  { v: "programming", ar: "برمجة", en: "Programming" },
  { v: "psychology", ar: "علم النفس", en: "Psychology" }
];

// ponytail: these four subjects also run a لغات (English-track) teacher pool,
// per project_subject_language_rule — offered as separate English-named picks
// (always English, regardless of the ar/en page toggle) alongside the Arabic one.
const SUBJECT_EN_COUSINS = [
  { v: "physics-en", en: "Physics" },
  { v: "chemistry-en", en: "Chemistry" },
  { v: "math-en", en: "Math" },
  { v: "accounting-en", en: "Accounting" }
];

const KNOWN_SUBJECT_SLUGS = new Set([...SUBJECTS.map(s => s.v), ...SUBJECT_EN_COUSINS.map(s => s.v)]);

// Whitelists against known subject slugs before storing — form.getAll() reflects
// raw POST data, not just what the checkbox UI rendered, so a crafted request
// could otherwise smuggle an arbitrary string into a column later rendered as HTML.
function sanitizeSubjects(values) {
  const known = values.map(v => v.toString().trim()).filter(v => KNOWN_SUBJECT_SLUGS.has(v));
  return [...new Set(known)].join(",");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ponytail: adopt for NEW render functions going forward (not retrofitted onto the
// ~30 existing escapeHtml() call sites below — those are already correct and locked
// in by the XSS regression tests in test/index.test.ts; rewriting them the night
// before a live staff test is unnecessary risk for zero functional gain).
// `html` auto-escapes every interpolated value; wrap already-safe HTML (e.g. output
// from another html`` template, or a trusted static fragment) in raw() to opt out.
export function raw(value) {
  return { __raw: String(value) };
}
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === undefined || v === null) {
      // append nothing
    } else if (v && typeof v === "object" && "__raw" in v) {
      out += v.__raw;
    } else if (Array.isArray(v)) {
      out += v.map(x => (x && typeof x === "object" && "__raw" in x) ? x.__raw : escapeHtml(x)).join("");
    } else {
      out += escapeHtml(v);
    }
    out += strings[i + 1];
  }
  return out;
}

const STAGES = [
  { v: "تالتة إعدادي", ar: "تالتة إعدادي", en: "3rd Prep" },
  { v: "أولى ثانوي", ar: "أولى ثانوي", en: "1st Secondary" },
  { v: "تانية ثانوي", ar: "تانية ثانوي", en: "2nd Secondary" },
  { v: "بكالوريا", ar: "بكالوريا", en: "Bakalorya" },
  { v: "تالتة ثانوي", ar: "تالتة ثانوي", en: "3rd Secondary" }
];

// مسار الطالب, from the paper estamara's عربي/لغات checkbox — a student-level
// declaration, distinct from the per-subject English-cousin slugs above.
const TRACKS = [
  { v: "arabic", ar: "عربي", en: "Arabic" },
  { v: "languages", ar: "لغات", en: "Languages" }
];

function trackRadios(lang, selectedValue) {
  return TRACKS.map(s => chip("radio", "track", s.v, selectedValue === s.v, lang === "en" ? s.en : s.ar)).join("");
}

function sanitizeTrack(v) {
  return TRACKS.some(t => t.v === v) ? v : "";
}

// Whitelisted at write time (same pattern as sanitizeTrack/sanitizeSubjects) —
// stage was previously stored raw despite the UI only offering STAGES' 5 fixed
// values, letting a crafted /register or /process POST plant a stored-XSS
// payload that would resurface at any future stage/class render site.
function sanitizeStage(v) {
  return STAGES.some(s => s.v === v) ? v : "";
}

const PAYMENT_METHODS = {
  cash: { ar: "كاش", en: "Cash" },
  instapay: { ar: "إنستاباي", en: "InstaPay" },
  vodafone_cash: { ar: "فودافون كاش", en: "Vodafone Cash" }
};

function chip(type, name, value, checked, label) {
  const req = type === "radio" ? "required" : "";
  return `<label class="subject-chip"><input type="${type}" name="${name}" value="${value}" ${checked ? "checked" : ""} ${req}> ${label}</label>`;
}

function subjectsCheckboxes(lang, checkedValues) {
  const checked = new Set((checkedValues || "").split(",").map(s => s.trim()).filter(Boolean));
  const main = SUBJECTS.map(s => chip("checkbox", "subjects", s.v, checked.has(s.v), lang === "en" ? s.en : s.ar));
  const cousins = SUBJECT_EN_COUSINS.map(s => chip("checkbox", "subjects", s.v, checked.has(s.v), s.en));
  return main.join("") + cousins.join("");
}

// Escaped here, once, so every consumer (subjectsDisplay's admin/promotions/teacher-panel
// call sites, plus subjectPills) is safe by construction instead of opt-in per renderer —
// covers legacy DB rows too, since sanitizeSubjects() only guards writes going forward.
function subjectNames(lang, csv) {
  if (!csv) return [];
  const map = new Map([
    ...SUBJECTS.map(s => [s.v, lang === "en" ? s.en : s.ar]),
    ...SUBJECT_EN_COUSINS.map(s => [s.v, s.en])
  ]);
  return csv.split(",").map(v => map.get(v.trim()) || v.trim()).filter(Boolean).map(escapeHtml);
}

function subjectsDisplay(lang, csv) {
  return subjectNames(lang, csv).join(" · ");
}

function subjectPills(lang, csv) {
  const names = subjectNames(lang, csv);
  if (!names.length) return "";
  return `<div class="sc-subjects">${names.map(n => `<span class="sc-subject-pill">${n}</span>`).join("")}</div>`;
}

function stageRadios(lang, selectedValue) {
  return STAGES.map(s => chip("radio", "stage", s.v, selectedValue === s.v, lang === "en" ? s.en : s.ar)).join("");
}

function baseSubject(slug) {
  return slug.endsWith("-en") ? slug.slice(0, -3) : slug;
}

async function getTeachersForSubjects(env, subjectsCsv) {
  const slugs = [...new Set((subjectsCsv || "").split(",").map(s => baseSubject(s.trim())).filter(Boolean))];
  if (!slugs.length) return {};
  const placeholders = slugs.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT id, subject, name, phase, mode, schedule, track, photo FROM teachers WHERE subject IN (${placeholders}) ORDER BY name`
  ).bind(...slugs).all();
  const grouped = {};
  for (const r of results) (grouped[r.subject] ||= []).push(r);
  return grouped;
}

// Unfiltered version of the above for the public /register form, where every
// subject's teachers are pre-rendered (hidden) up front and toggled client-side
// as the student checks boxes — no server round-trip per checkbox.
async function getAllTeachersGrouped(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, subject, name, phase, mode, schedule, track, photo FROM teachers ORDER BY name`
  ).all();
  const grouped = {};
  for (const r of results) (grouped[r.subject] ||= []).push(r);
  return grouped;
}

// Shared by /scan (phone camera, full HTML page) and /admin/scan-mark (JSON,
// used by the /admin/counter kiosk page for a hardware QR scanner) — one place
// for the lookup + approval gate + same-day dedup insert.
// groupId ties the scan to a class session (front-desk counter kiosk pinned to
// one group via /admin/counter?group=ID). Left null for ungrouped/walk-in scans
// (the phone /scan flow, or a counter with no group set) — the DB's unique
// index only dedupes within a given (student, group, day), so a null group_id
// needs its own explicit check here to keep the old "once per day" behavior.
async function markAttendance(env, studentId, groupId = null) {
  const student = await env.DB.prepare("SELECT id, name, status, stage, class, photo FROM students WHERE id = ?").bind(studentId).first();
  if (!student) return { result: "not_found" };
  if (student.status !== "approved") return { result: "pending", name: student.name };

  // Identity-check data for the counter kiosk's confirmation card (2026-07-14:
  // staff need more than a bare name to catch a mixed-up QR code) — stage and a
  // photo-thumbnail link, not the whole student record.
  const base = {
    name: student.name,
    stage: student.stage || student.class || "",
    photoUrl: student.photo ? `/admin/students/${student.id}/photo` : null
  };

  if (groupId === null) {
    // Relies on idx_attendance_student_nogroup_day (partial unique index,
    // migration 0010) to reject a same-day duplicate atomically instead of a
    // separate SELECT-then-INSERT, which was a TOCTOU race (claude-review,
    // PR #8) — two near-simultaneous scans could both pass the existence
    // check before either insert landed.
    const { meta } = await env.DB.prepare("INSERT OR IGNORE INTO attendance (student_id) VALUES (?)").bind(studentId).run();
    return { result: meta.changes > 0 ? "marked" : "already", ...base };
  }

  // room_name flows through to the recent-scans table and /admin/today so scans
  // from different concurrent lecture halls (4 rooms can run at once) are never
  // shown as an unlabeled flat list — see HARV_ATTENDANCE_SUPPORT_PLAYBOOK.md.
  // Group must exist and be active (claude-review, PR #8): /scan is
  // unauthenticated and group ids are small sequential integers, so an
  // unvalidated group_id would let anyone credit an arbitrary/nonexistent
  // group's attendance for any student — and per_session teacher payouts are
  // computed directly from these attendance rows, making this a real
  // fraud/money-integrity gap, not just a data-quality one.
  const group = await env.DB.prepare(
    `SELECT g.teacher_name, g.subject, r.name AS room_name
     FROM groups g LEFT JOIN rooms r ON r.id = g.room_id WHERE g.id = ? AND g.active = 1`
  ).bind(groupId).first();
  if (!group) return { result: "invalid_group", ...base };
  const { meta } = await env.DB.prepare("INSERT OR IGNORE INTO attendance (student_id, group_id, teacher_name) VALUES (?, ?, ?)")
    .bind(studentId, groupId, group.teacher_name).run();
  return {
    result: meta.changes > 0 ? "marked" : "already",
    ...base,
    roomName: group.room_name || null
  };
}

// Active bookings only — dropped/transferred rows are kept for history (see
// getDroppedBookings below) but excluded here so totals/process-page/student
// card all reflect what the student is actually currently enrolled in.
async function getBookings(env, studentId) {
  const { results } = await env.DB.prepare(
    "SELECT id, subject, teacher_name, schedule, amount FROM bookings WHERE student_id = ? AND status = 'active' ORDER BY id"
  ).bind(studentId).all();
  return results;
}

// Staff-facing only (estamara view) — history of bookings a clerk dropped,
// with the reason, mirroring the old CenterStudent app's deleted_from_group table.
async function getDroppedBookings(env, studentId) {
  const { results } = await env.DB.prepare(
    "SELECT id, subject, teacher_name, schedule, amount, status_reason FROM bookings WHERE student_id = ? AND status != 'active' ORDER BY id"
  ).bind(studentId).all();
  return results;
}

function droppedBookingsHtml(lang, dropped) {
  if (!dropped.length) return "";
  const heading = lang === "en" ? "Dropped subjects" : "مواد ملغاة";
  // subjectsDisplay() and every nested html`` call already return safe,
  // pre-escaped HTML — each must be wrapped in raw() before it's interpolated
  // into the outer html`` template, or the outer tag escapes it a second time
  // (this bit us for real: <br><small> was showing up as literal text).
  const rows = dropped.map(b => html`<div class="card stripe-b"><div>
    <strong>${raw(subjectsDisplay(lang, b.subject))}</strong>${b.teacher_name ? raw(html` — ${b.teacher_name}`) : ""}
    ${b.status_reason ? raw(html`<br><small>${b.status_reason}</small>`) : ""}
  </div></div>`);
  return html`<h2 style="font-size:15px;margin:16px 0 8px;color:var(--muted)">${raw(heading)}</h2>${raw(rows.join(""))}`;
}

function dropBookingForm(lang, bookingId, langQs) {
  const L = lang === "en"
    ? { placeholder: "Reason (optional)", drop: "Drop" }
    : { placeholder: "السبب (اختياري)", drop: "إلغاء" };
  return html`<form method="POST" action="/admin/bookings/${bookingId}/drop${raw(langQs)}" class="no-print" style="display:inline-flex;gap:4px;margin-inline-start:8px">
    <input name="reason" placeholder="${L.placeholder}" style="width:140px">
    <button type="submit" class="btn-reject">${L.drop}</button>
  </form>`;
}

// Shared between the staff-facing /admin/students/:id/estamara view and the
// student/parent-facing /student card — same estamara table, two audiences.
const ESTAMARA_I18N = {
  ar: {
    notFound: "الطالب غير موجود.", print: "🖨️ طباعة",
    name: "اسم الطالب", school: "المدرسة", stage: "الصف الدراسي", track: "المسار",
    phone: "تليفون الطالب", parentPhone: "تليفون ولي الأمر", fatherPhone: "تليفون الأب",
    motherPhone: "تليفون الأم", homePhone: "تليفون المنزل", address: "العنوان",
    m: "م", subject: "المادة", teacher: "الأستاذ", schedule: "المواعيد", amount: "المبلغ",
    total: "إجمالي قيمة الحجز"
  },
  en: {
    notFound: "Student not found.", print: "🖨️ Print",
    name: "Student name", school: "School", stage: "Grade", track: "Track",
    phone: "Student phone", parentPhone: "Guardian phone", fatherPhone: "Father's phone",
    motherPhone: "Mother's phone", homePhone: "Home phone", address: "Address",
    m: "#", subject: "Subject", teacher: "Teacher", schedule: "Schedule", amount: "Fee",
    total: "Total reservation value"
  }
};

// dropDetails (staff-only, e.g. { langQs }) adds an extra column with a
// per-row drop form — omitted on the student card and process/handoff pages,
// which have no business dropping a booking.
function bookingTableHtml(lang, bookings, dropDetails = null) {
  const t = ESTAMARA_I18N[lang];
  const total = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const rows = bookings.map((b, i) => `<tr>
    <td>${i + 1}</td><td>${subjectsDisplay(lang, b.subject)}</td>
    <td>${escapeHtml(b.teacher_name || "")}</td><td>${escapeHtml(b.schedule || "")}</td>
    <td>${(b.amount || 0).toFixed(2)}</td>
    ${dropDetails ? `<td class="no-print">${dropBookingForm(lang, b.id, dropDetails.langQs)}</td>` : ""}
  </tr>`).join("") || `<tr><td colspan="${dropDetails ? 6 : 5}">—</td></tr>`;
  return `<table class="booking-table">
    <thead><tr><th>${t.m}</th><th>${t.subject}</th><th>${t.teacher}</th><th>${t.schedule}</th><th>${t.amount}</th>${dropDetails ? `<th class="no-print"></th>` : ""}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="estamara-total">${t.total}: ${total.toFixed(2)}</div>`;
}

// Balance = active bookings' fees minus their discounts minus payments received.
// Computed on read (same pattern as the booking total), never stored.
export async function getStudentBalance(env, studentId) {
  const [owedRow, paidRow] = await Promise.all([
    env.DB.prepare("SELECT COALESCE(SUM(amount - discount_amount), 0) AS n FROM bookings WHERE student_id = ? AND status = 'active'").bind(studentId).first(),
    env.DB.prepare("SELECT COALESCE(SUM(amount), 0) AS n FROM payments WHERE student_id = ?").bind(studentId).first()
  ]);
  const owed = owedRow.n;
  const paid = paidRow.n;
  return { owed, paid, balance: owed - paid };
}

async function getPayments(env, studentId) {
  const { results } = await env.DB.prepare(
    "SELECT id, amount, method, note, created_at FROM payments WHERE student_id = ? ORDER BY id"
  ).bind(studentId).all();
  return results;
}

const PAY_I18N = {
  ar: {
    owed: "المطلوب", paid: "المدفوع", balance: "المتبقي", fullyPaid: "مدفوع بالكامل",
    amount: "المبلغ", amountPh: "بالجنيه", method: "طريقة الدفع", note: "ملاحظة (اختياري)", notePh: "اختياري", record: "تسجيل دفعة",
    history: "سجل الدفعات", receipt: "إيصال"
  },
  en: {
    owed: "Owed", paid: "Paid", balance: "Balance", fullyPaid: "Fully paid",
    amount: "Amount", amountPh: "in EGP", method: "Payment method", note: "Note (optional)", notePh: "optional", record: "Record payment",
    history: "Payment history", receipt: "Receipt"
  }
};

function balanceSummaryHtml(lang, bal) {
  const t = PAY_I18N[lang];
  const balanceLabel = bal.balance > 0 ? `<strong style="color:var(--red)">${bal.balance.toFixed(2)}</strong>` : `<strong style="color:#1F9D55">${t.fullyPaid}</strong>`;
  return `<div class="estamara-total">${t.owed}: ${bal.owed.toFixed(2)} · ${t.paid}: ${bal.paid.toFixed(2)} · ${t.balance}: ${balanceLabel}</div>`;
}

function paymentFormHtml(lang, studentId, langQs) {
  const t = PAY_I18N[lang];
  const payOptions = Object.entries(PAYMENT_METHODS).map(([key, label]) =>
    `<option value="${key}">${lang === "en" ? label.en : label.ar}</option>`
  ).join("");
  return `<form method="POST" action="/admin/students/${studentId}/pay${langQs}" class="no-print" style="margin-top:12px">
    <label>${t.amount}</label><input name="amount" type="number" step="0.01" min="0.01" placeholder="${t.amountPh}" required>
    <label>${t.method}</label><select name="method">${payOptions}</select>
    <label>${t.note}</label><input name="note" placeholder="${t.notePh}">
    <button type="submit">${t.record}</button>
  </form>`;
}

function paymentsHistoryHtml(lang, payments) {
  if (!payments.length) return "";
  const t = PAY_I18N[lang];
  const rows = payments.map(p => html`<div class="card"><div>
    <strong>${(p.amount || 0).toFixed(2)}</strong>${p.method ? raw(html` — ${p.method}`) : ""}<br>
    <small>${p.created_at}${p.note ? raw(html` · ${p.note}`) : ""}</small>
  </div></div>`).join("");
  return html`<h2 style="font-size:15px;margin:16px 0 8px">${raw(t.history)}</h2>${raw(rows)}`;
}

async function getActivePromotions(env, subjectsCsv) {
  const slugs = [...new Set((subjectsCsv || "").split(",").map(s => baseSubject(s.trim())).filter(Boolean))];
  const placeholders = slugs.map(() => "?").join(",");
  const query = slugs.length
    ? `SELECT id, subject, teacher_name, text FROM promotions WHERE active = 1 AND (subject IS NULL OR subject IN (${placeholders}))`
    : `SELECT id, subject, teacher_name, text FROM promotions WHERE active = 1 AND subject IS NULL`;
  const { results } = await env.DB.prepare(query).bind(...slugs).all();
  return results;
}

const DUAL_TRACK_SUBJECTS = new Set(["math", "physics", "chemistry", "accounting"]);
const STAGE_TO_PHASE = { "تانية ثانوي": "bac2", "تالتة ثانوي": "bac3" };

function phaseLabel(lang, phase) {
  if (phase === "bac2") return lang === "en" ? "2nd Secondary" : "تانية ثانوي";
  if (phase === "bac3") return lang === "en" ? "3rd Secondary" : "تالتة ثانوي";
  return "";
}

function modeBadgeClass(mode) {
  const hasOnline = mode.includes("اونلاين") || mode.includes("أونلاين");
  const hasCenter = mode.includes("سنتر");
  if (hasOnline && hasCenter) return "mode-both";
  if (hasOnline) return "mode-online";
  if (hasCenter) return "mode-center";
  return "mode-other";
}

// Public design-system site's live photo folder (verified reachable) — reused
// directly rather than duplicating image bytes into this Worker/D1.
const TEACHER_PHOTO_BASE = "https://harvcentereg.com";

// pickName (e.g. "pick_math") turns the card into a real radio option — used
// on both /register (student picks) and the clerk's process page (staff picks/
// overrides). Pass null for a plain read-only card (currently unused, kept as
// the fallback so a future non-picking listing doesn't need a new function).
function teacherCard(lang, t, pickName, checked) {
  const phase = phaseLabel(lang, t.phase);
  const scheduleText = t.schedule || (lang === "en" ? "Schedule TBD — ask the teacher directly" : "الجدول لسه هيتحدد — اسأل المدرس مباشرة");
  const modeBadge = t.mode ? `<span class="mode-badge ${modeBadgeClass(t.mode)}">${t.mode}</span>` : "";
  const photo = t.photo
    ? `<img class="t-photo" src="${TEACHER_PHOTO_BASE}${escapeHtml(t.photo)}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : `<div class="t-photo t-photo--empty" aria-hidden="true">${(t.name || "").trim().charAt(0)}</div>`;
  const input = pickName
    ? `<input type="radio" name="${pickName}" value="${t.id}" ${checked ? "checked" : ""} data-teacher-name="${escapeHtml(t.name)}" data-teacher-schedule="${escapeHtml(t.schedule || "")}">`
    : "";
  const tag = pickName ? "label" : "div";
  return `<${tag} class="teacher-card${pickName ? " teacher-card--pick" : ""}">
    ${input}
    ${photo}
    <div class="t-info">
      <div class="t-name">${t.name}${phase ? ` <span class="t-phase">· ${phase}</span>` : ""}</div>
      <div class="t-schedule">🕒 ${scheduleText}</div>
      ${modeBadge}
    </div>
  </${tag}>`;
}

function teacherRefPanel(lang, subjectsCsv, teachersBySubject, promos, stage, bookings) {
  const slugs = (subjectsCsv || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!slugs.length && !promos.length) return "";
  const noTeachers = lang === "en" ? "No teachers currently available for this subject." : "لا يوجد مدرسين متاحين حاليًا لهذه المادة.";
  const heading = lang === "en" ? "👨‍🏫 Pick a teacher per subject" : "👨‍🏫 اختار مدرس لكل مادة";
  const hint = lang === "en"
    ? "Tap a teacher to fill their name + schedule into the booking row below."
    : "دوس على المدرس عشان اسمه وميعاده يتملوا لوحدهم في صف الحجز تحت.";
  const phaseWanted = STAGE_TO_PHASE[stage] || null;
  // Bookings already on file (either picked at online /register, or from a prior
  // processing) — used to pre-check the matching teacher card so staff can see
  // at a glance what's already assigned instead of hunting through the list.
  const bookedNameBySlug = new Map((bookings || []).map(b => [b.subject, b.teacher_name]));
  const sections = slugs.map(slug => {
    const base = baseSubject(slug);
    const isEnCousin = slug.endsWith("-en");
    const label = subjectsDisplay(lang, slug);
    let teachers = teachersBySubject[base] || [];
    // A student who picked the English-named option (لغات track) is a different
    // population than one who picked the Arabic-named option (عربي track) —
    // never mix the two, in either direction.
    if (DUAL_TRACK_SUBJECTS.has(base)) {
      teachers = isEnCousin ? teachers.filter(t => t.track !== "عربي") : teachers.filter(t => t.track !== "لغات");
    }
    // Prefer teachers whose phase (grade-year) matches the student's own grade —
    // sort them first, but never hide a mismatched/unrecorded one entirely.
    // Phase data is sparse and inconsistently tagged; an empty "no teachers"
    // result is worse for a clerk than a list that isn't perfectly sorted.
    if (phaseWanted) {
      teachers = teachers.slice().sort((a, b) => {
        const aMatch = !a.phase || a.phase === phaseWanted ? 0 : 1;
        const bMatch = !b.phase || b.phase === phaseWanted ? 0 : 1;
        return aMatch - bMatch;
      });
    }
    const bookedName = bookedNameBySlug.get(slug);
    const rows = teachers.map(t => teacherCard(lang, t, `refpick_${slug}`, bookedName === t.name)).join("") || `<p class="empty" style="padding:4px 0">${noTeachers}</p>`;
    return `<div class="teacher-subject-block"><h3>${label}</h3><div class="teacher-pick-grid">${rows}</div></div>`;
  }).join("");
  const promoBlock = promos.length
    ? `<div class="promo-box">${promos.map(p => `💡 ${p.teacher_name ? `<strong>${p.teacher_name}</strong> — ` : ""}${p.text}`).join("<br>")}</div>`
    : "";
  // Fills the matching booking row's free-text teacher/schedule inputs below —
  // the booking row is still the source of truth staff submits (subject-matched
  // by <select name="b_subject">'s live value), this panel is a fast picker on
  // top of it, not a separate data path.
  const wiring = slugs.length ? `<script>
  (function(){
    document.querySelectorAll('input[name^="refpick_"]').forEach(function(radio){
      radio.addEventListener("change", function(){
        var slug = radio.name.slice("refpick_".length);
        document.querySelectorAll("#booking-rows tr").forEach(function(tr){
          var sel = tr.querySelector('select[name="b_subject"]');
          if (!sel || sel.value !== slug) return;
          var teacherInput = tr.querySelector('input[name="b_teacher"]');
          var scheduleInput = tr.querySelector('input[name="b_schedule"]');
          if (teacherInput) teacherInput.value = radio.dataset.teacherName || "";
          if (scheduleInput) scheduleInput.value = radio.dataset.teacherSchedule || "";
        });
      });
    });
  })();
  </script>` : "";
  return `<div class="teacher-ref-panel"><h2 style="font-size:17px;margin:0 0 6px">${heading}</h2><p class="pick-hint">${hint}</p>${sections}${promoBlock}${wiring}</div>`;
}

// Most students come in looking for a specific teacher, not knowing the subject
// slug system — so the public /register form shows the matching teacher(s) the
// moment a subject checkbox is ticked. One hidden block per subject is rendered
// up front (same track-split rule as teacherRefPanel above) and a tiny inline
// script toggles `hidden` on the matching block per checkbox `change` event —
// no client-side templating, no extra request per click.
function subjectTeacherBlocks(lang, teachersBySubject) {
  const all = [...SUBJECTS.map(s => s.v), ...SUBJECT_EN_COUSINS.map(s => s.v)];
  const skipNote = lang === "en"
    ? "Not sure yet? No problem — leave it, staff will help you choose at registration."
    : "لسه مش عارف مين؟ معلش، سيبها كده وهنساعدك تختار وانت بتسجل.";
  return all.map(slug => {
    const base = baseSubject(slug);
    const isEnCousin = slug.endsWith("-en");
    let teachers = teachersBySubject[base] || [];
    if (DUAL_TRACK_SUBJECTS.has(base)) {
      teachers = isEnCousin ? teachers.filter(t => t.track !== "عربي") : teachers.filter(t => t.track !== "لغات");
    }
    if (!teachers.length) return "";
    const label = subjectsDisplay(lang, slug);
    const rows = teachers.map(t => teacherCard(lang, t, `pick_${slug}`, false)).join("");
    return `<div class="teacher-subject-block" data-subject-block="${slug}" hidden><h3>${label}</h3><div class="teacher-pick-grid">${rows}</div><p class="pick-skip-note">${skipNote}</p></div>`;
  }).join("");
}

// Remaining estamara contact fields — shared by /register and the clerk's
// process form. Father/mother/home phone + address are all optional free text
// (only the student's own phone + parent_phone are mandatory/validated).
function contactFields(lang, s = {}) {
  const L = lang === "en"
    ? { father: "Father's phone", mother: "Mother's phone", home: "Home phone", address: "Address" }
    : { father: "تليفون الأب", mother: "تليفون الأم", home: "تليفون المنزل", address: "العنوان" };
  return `
  <label>${L.father}</label>
  <input name="father_phone" type="tel" placeholder="01xxxxxxxxx" value="${escapeHtml(s.father_phone || "")}">
  <label>${L.mother}</label>
  <input name="mother_phone" type="tel" placeholder="01xxxxxxxxx" value="${escapeHtml(s.mother_phone || "")}">
  <label>${L.home}</label>
  <input name="home_phone" type="tel" value="${escapeHtml(s.home_phone || "")}">
  <label>${L.address}</label>
  <input name="address" value="${escapeHtml(s.address || "")}">`;
}

function subjectOptions(lang, selected) {
  const opt = (v, label) => `<option value="${v}" ${selected === v ? "selected" : ""}>${label}</option>`;
  const main = SUBJECTS.map(s => opt(s.v, lang === "en" ? s.en : s.ar));
  const cousins = SUBJECT_EN_COUSINS.map(s => opt(s.v, s.en));
  return `<option value="">—</option>${main.join("")}${cousins.join("")}`;
}

// groupOptionsHtml is pre-rendered once by bookingRowsWidget (every row shares
// the same catalog) — each <option> carries data-teacher/-schedule/-price so
// picking one can auto-fill the free-text fields client-side (fields stay
// editable after — the group is a starting point, not a lock).
function bookingRow(lang, i, b, groupOptionsHtml) {
  const L = lang === "en"
    ? { teacher: "Teacher", schedule: "Schedule", amount: "Fee", remove: "✕", group: "Group (optional)", groupNone: "— free text —" }
    : { teacher: "الأستاذ", schedule: "المواعيد", amount: "المبلغ", remove: "✕", group: "المجموعة (اختياري)", groupNone: "— نص حر —" };
  const selectedGroup = b.group_id ? String(b.group_id) : "";
  return `<tr>
    <td>${i + 1}</td>
    <td><select name="b_subject" required>${subjectOptions(lang, b.subject || "")}</select></td>
    <td><select name="b_group" class="booking-group-select" title="${L.group}" onchange="fillFromGroup(this)"><option value="">${L.groupNone}</option>${(groupOptionsHtml || "").replace(`value="${selectedGroup}"`, `value="${selectedGroup}" selected`)}</select></td>
    <td><input name="b_teacher" list="booking-teacher-list" placeholder="${L.teacher}" value="${escapeHtml(b.teacher_name || "")}"></td>
    <td><input name="b_schedule" placeholder="${L.schedule}" value="${escapeHtml(b.schedule || "")}"></td>
    <td><input name="b_amount" type="number" step="0.01" min="0" placeholder="${L.amount}" value="${b.amount ?? ""}" oninput="updateBookingTotal()"></td>
    <td><button type="button" class="btn-reject" onclick="this.closest('tr').remove(); updateBookingTotal()">${L.remove}</button></td>
  </tr>`;
}

// Pre-seeds one row per subject the student already picked (matching the
// estamara's table); re-processing an already-processed student shows the
// bookings actually on file instead of resetting to blank.
// groups: getGroupsWithSeats() rows (active only) — rendered as one shared
// <option> list reused by every row via bookingRow()'s groupOptionsHtml.
function bookingRowsWidget(lang, subjectsCsv, bookings, teachersBySubject, groups = []) {
  const L = lang === "en"
    ? { subject: "Subject", teacher: "Teacher", schedule: "Schedule", amount: "Fee", total: "Total (إجمالي قيمة الحجز)", add: "➕ Add subject" }
    : { subject: "المادة", teacher: "الأستاذ", schedule: "المواعيد", amount: "المبلغ", total: "إجمالي قيمة الحجز", add: "➕ إضافة مادة" };
  const seedRows = bookings.length
    ? bookings.map(b => ({ subject: b.subject, teacher_name: b.teacher_name, schedule: b.schedule, amount: b.amount, group_id: b.group_id }))
    : (subjectsCsv || "").split(",").map(s => s.trim()).filter(Boolean).map(subject => ({ subject, teacher_name: "", schedule: "", amount: "", group_id: null }));
  const groupOptionsHtml = groups.map(g => {
    const seats = g.capacity ? `${g.enrolled}/${g.capacity}` : `${g.enrolled}`;
    const label = `${g.teacher_name} — ${g.subject} — ${[g.day, g.time].filter(Boolean).join(" ")} (${seats})`;
    return `<option value="${g.id}" data-teacher="${escapeHtml(g.teacher_name)}" data-schedule="${escapeHtml([g.day, g.time].filter(Boolean).join(" · "))}" data-price="${g.price ?? 0}" data-subject="${g.subject}">${escapeHtml(label)}</option>`;
  }).join("");
  const rowsHtml = seedRows.map((b, i) => bookingRow(lang, i, b, groupOptionsHtml)).join("");
  const teacherNames = [...new Set(Object.values(teachersBySubject || {}).flat().map(t => t.name))];
  const teacherList = `<datalist id="booking-teacher-list">${teacherNames.map(n => `<option value="${escapeHtml(n)}">`).join("")}</datalist>`;
  return `${teacherList}
  <table class="booking-table">
    <thead><tr><th>#</th><th>${L.subject}</th><th></th><th>${L.teacher}</th><th>${L.schedule}</th><th>${L.amount}</th><th></th></tr></thead>
    <tbody id="booking-rows">${rowsHtml}</tbody>
    <tfoot><tr><td colspan="5" style="text-align:end">${L.total}</td><td id="booking-total">0</td><td></td></tr></tfoot>
  </table>
  <button type="button" onclick="addBookingRow()">${L.add}</button>
  <template id="booking-row-template">${bookingRow(lang, 0, {}, groupOptionsHtml)}</template>
  <script>
    function updateBookingTotal(){
      var sum=0;
      document.querySelectorAll('#booking-rows input[name="b_amount"]').forEach(function(i){ sum += parseFloat(i.value)||0; });
      document.getElementById('booking-total').textContent = sum.toFixed(2);
    }
    function fillFromGroup(sel){
      var opt = sel.options[sel.selectedIndex];
      var tr = sel.closest('tr');
      if (!opt.value) return;
      tr.querySelector('[name="b_teacher"]').value = opt.dataset.teacher || '';
      tr.querySelector('[name="b_schedule"]').value = opt.dataset.schedule || '';
      tr.querySelector('[name="b_amount"]').value = opt.dataset.price || '0';
      var subjSel = tr.querySelector('[name="b_subject"]');
      if (opt.dataset.subject && subjSel.querySelector('option[value="' + opt.dataset.subject + '"]')) subjSel.value = opt.dataset.subject;
      updateBookingTotal();
    }
    function addBookingRow(){
      var tpl = document.getElementById('booking-row-template').innerHTML;
      var tbody = document.getElementById('booking-rows');
      var tr = document.createElement('tr');
      tr.innerHTML = tpl.replace('<tr>','').replace('</tr>','');
      tbody.appendChild(tr);
    }
    updateBookingTotal();
  </script>`;
}

// POST parser for the widget above — zips the 5 parallel arrays by index,
// drops fully-empty rows (a subject select left at "—" with nothing else set).
function parseBookingRows(form) {
  const subjects = form.getAll("b_subject").map(v => v.toString().trim());
  const groupIds = form.getAll("b_group").map(v => v.toString().trim());
  const teachers = form.getAll("b_teacher").map(v => v.toString().trim());
  const schedules = form.getAll("b_schedule").map(v => v.toString().trim());
  const amounts = form.getAll("b_amount").map(v => v.toString().trim());
  const rows = [];
  for (let i = 0; i < subjects.length; i++) {
    if (!subjects[i] && !teachers[i] && !schedules[i] && !amounts[i]) continue;
    if (!KNOWN_SUBJECT_SLUGS.has(subjects[i])) continue;
    const amount = parseFloat(amounts[i]);
    const groupId = parseInt(groupIds[i], 10);
    // teachers[i]/schedules[i] can be undefined if a crafted POST sends mismatched
    // array lengths across the 5 b_* fields — D1's .bind() rejects undefined outright.
    rows.push({
      subject: subjects[i], teacher_name: teachers[i] || "", schedule: schedules[i] || "",
      amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
      group_id: Number.isFinite(groupId) ? groupId : null
    });
  }
  return rows;
}

function parentPhoneField(lang, parentPhone) {
  const label = lang === "en"
    ? "Parent/guardian WhatsApp number (required, must differ from the student's number)"
    : "رقم واتساب ولي الأمر (إجباري، ولازم يكون مختلف عن رقم الطالب)";
  return `<label>${label}</label>
  <input name="parent_phone" type="tel" placeholder="01xxxxxxxxx" value="${escapeHtml(parentPhone || "")}" required>`;
}

function waLink(phone, text) {
  const digits = (phone || "").replace(/\D/g, "");
  let intl = digits;
  if (digits.startsWith("0")) intl = "20" + digits.slice(1);
  else if (!digits.startsWith("20")) intl = "20" + digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

function bytesToBase64(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

// Cloudflare Access injects this alongside the JWT assertion already checked
// below — reused instead of a separate login system (the old CenterStudent
// app's `use` table was a hand-rolled password store, crackable via a string
// left in the compiled exe; not repeating that here).
// Bootstrap rule: if `staff` has zero rows, nobody's been onboarded yet, so
// every Access-authenticated request is treated as 'owner' rather than locking
// everyone out. Once staff exist, an Access-authenticated email with no
// matching row defaults to 'clerk' (day-to-day access, not financial views) —
// safer than silently granting 'owner' to someone IT hasn't onboarded yet.
async function getStaffRole(env, email) {
  if (!email) return null;
  const staffCount = await env.DB.prepare("SELECT COUNT(*) AS n FROM staff").first();
  if (staffCount.n === 0) return "owner";
  const row = await env.DB.prepare("SELECT role FROM staff WHERE email = ? AND active = 1").bind(email).first();
  return row ? row.role : "clerk";
}

function roleAllowed(role, allowed) {
  return allowed.includes(role);
}

// ponytail: a shared module-level Response instance would break after the
// first use (Response bodies are single-use streams) — a fresh one every call.
function forbiddenRole() {
  return new Response("Forbidden", { status: 403 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ponytail: defense-in-depth — Access gates /admin* at Cloudflare's edge, but
    // nothing in the Worker verified that until now (see the 2026-07-11 dashboard
    // leak). If this header is missing, the request never went through Access.
    if (url.pathname.startsWith("/admin") && !request.headers.get("Cf-Access-Jwt-Assertion")) {
      return new Response("Forbidden", { status: 403 });
    }

    const staffEmail = request.headers.get("Cf-Access-Authenticated-User-Email") || null;
    const staffRole = url.pathname.startsWith("/admin") ? await getStaffRole(env, staffEmail) : null;

    // Replaced the old flat /admin/dashboard (2026-07-13, see /council verdict
    // in HARV_ATTENDANCE_SUPPORT_PLAYBOOK.md) with three role/time-split hubs:
    // intake (staff landing), session (in-class ops), owner (gated finance/mgmt).
    const INTAKE_I18N = {
      ar: {
        title: "الرئيسية", pendingTitle: "بانتظار المعالجة", pendingLink: "عرض كل الطلاب / بحث",
        pendingNone: "مفيش حد بانتظار المعالجة دلوقتي.",
        comingTitle: "الحصص والمجموعات", groupsLink: "🗂️ المجموعات", roomsLink: "🚪 القاعات",
        estamaratLink: "📋 الاستمارات", promosLink: "📢 العروض",
        sessionCta: "▶️ أثناء الحصة", counterCta: "📷 السكانر",
        walkInTitle: "🆕 طالب جديد وصل دلوقتي", walkInName: "الاسم", walkInNamePh: "اسم الطالب",
        walkInClass: "الصف (اختياري)", walkInClassPh: "-- اختر الصف --", walkInSubmit: "ابدأ التسجيل ←",
        hint: "الصفحة دي بوابتك اليومية: دوس \"أثناء الحصة\" وانت جوه المجموعة، أو افتح \"طالب جديد وصل دلوقتي\" تحت لو حد وصل. محتاج تفاصيل أكتر؟ دوس ❓ تحت يمين وقت ما تحتاجها."
      },
      en: {
        title: "Home", pendingTitle: "Pending processing", pendingLink: "View all students / search",
        pendingNone: "Nobody's waiting on processing right now.",
        comingTitle: "Classes & groups", groupsLink: "🗂️ Groups", roomsLink: "🚪 Rooms",
        estamaratLink: "📋 Applications", promosLink: "📢 Promotions",
        sessionCta: "▶️ In Session", counterCta: "📷 Scanner",
        walkInTitle: "🆕 A student just walked in", walkInName: "Name", walkInNamePh: "Student's name",
        walkInClass: "Grade (optional)", walkInClassPh: "-- Pick a grade --", walkInSubmit: "Start registration ←",
        hint: "This is your daily starting point: tap \"In Session\" once you're in class, or open \"A student just walked in\" below if someone shows up. Need more detail? Tap ❓ in the corner any time."
      }
    };

    const SESSION_I18N = {
      ar: {
        title: "أثناء الحصة", back: "← الرئيسية",
        todayLink: "✅ حضور اليوم", counterLink: "📷 سكانر الاستقبال", printLink: "🖨️ كشف ورقي",
        findStudentLink: "🔎 بحث عن طالب (تسجيل دفعة)"
      },
      en: {
        title: "In Session", back: "← Home",
        todayLink: "✅ Today's Attendance", counterLink: "📷 Counter Scanner", printLink: "🖨️ Print Sheet",
        findStudentLink: "🔎 Find a Student (record payment)"
      }
    };

    const OWNER_I18N = {
      ar: {
        title: "إدارة", pending: "بانتظار المعالجة", today: "حضور النهاردة",
        collectedToday: "المحصّل النهاردة", outstanding: "المتبقي على الطلاب",
        ledgerLink: "💰 دفتر الحساب", teachersLink: "🎓 الأساتذة", staffLink: "👤 الموظفين"
      },
      en: {
        title: "Management", pending: "Pending processing", today: "Today's attendance",
        collectedToday: "Collected today", outstanding: "Outstanding balance",
        ledgerLink: "💰 Ledger", teachersLink: "🎓 Teachers", staffLink: "👤 Staff"
      }
    };

    if (url.pathname === "/" && request.method === "GET") {
      // ponytail: dashboard used to render here (no Access gate on "/"); relocated
      // to /admin/intake so the existing /admin* Access path-match covers it.
      return Response.redirect(new URL("/admin/intake" + url.search, request.url).toString(), 302);
    }

    const ADMIN_I18N = {
      ar: {
        title: "الطلاب", regLink: "رابط تسجيل الطلاب (شاركه على الواتساب):",
        pending: "بانتظار المعالجة", process: "معالجة ← ", reject: "حذف",
        addName: "اسم الطالب", addNamePh: "اكتب اسم الطالب",
        addClass: "الصف", addClassPh: "مثال: ثانوية عامة", addSubmit: "إضافة طالب (بيحتاج معالجة)",
        empty: "لا يوجد طلاب مسجلين بعد."
      },
      en: {
        title: "Students", regLink: "Student registration link (share on WhatsApp):",
        pending: "Pending processing", process: "Process → ", reject: "Delete",
        addName: "Student name", addNamePh: "Enter student name",
        addClass: "Class", addClassPh: "e.g. General Secondary", addSubmit: "Add student (needs processing)",
        empty: "No students registered yet."
      }
    };

    if (url.pathname === "/admin" && request.method === "GET") {
      const lang = langOf(url);
      const t = ADMIN_I18N[lang];
      const langQs = lang === "en" ? "?lang=en" : "";
      const { results } = await env.DB.prepare(
        "SELECT id, name, class, school, stage, phone, email, subjects, photo, photo_type, status FROM students ORDER BY (status='pending') DESC, name"
      ).all();
      const pending = results.filter(s => s.status === "pending");
      const approved = results.filter(s => s.status !== "pending");

      const pendingCards = pending.map(s => {
        const photoImg = s.photo
          ? `<img class="pending-photo" src="data:${s.photo_type || "image/jpeg"};base64,${bytesToBase64(s.photo)}">`
          : "";
        const subjectsLine = subjectsDisplay(lang, s.subjects);
        return `<div class="card pending-card">
          ${photoImg}
          <div>
            <span class="badge-pending">${t.pending}</span><br>
            <strong>${escapeHtml(s.name)}</strong><br>
            <small>${[s.school, s.stage].filter(Boolean).map(escapeHtml).join(" · ")}</small><br>
            <small>${[s.phone, s.email].filter(Boolean).map(escapeHtml).join(" · ")}</small>
            ${subjectsLine ? `<br><small>${subjectsLine}</small>` : ""}
            <div class="pending-actions">
              <a href="/admin/students/${s.id}/process${langQs}"><button type="button">${t.process}</button></a>
              <form method="POST" action="/admin/students/${s.id}/reject${langQs}"><button type="submit" class="btn-reject">${t.reject}</button></form>
            </div>
          </div>
        </div>`;
      }).join("");

      // One-tap "send link" straight from the roster row (2026-07-14) — sending
      // a student their link no longer requires opening their full record
      // first. SUCCESS_I18N isn't in scope this early in the file (const, not
      // hoisted), so this uses its own short message rather than reusing it.
      const cards = approved.map((s, i) => {
        const scanUrl = `${url.origin}/scan?student=${s.id}`;
        const studentUrl = `${url.origin}/student?id=${s.id}`;
        const waHref = s.phone ? waLink(s.phone, `أهلاً ${s.name} 👋 لينكك في هارف: ${studentUrl}`) : null;
        return `<div class="card ${i % 2 === 0 ? "stripe-a" : "stripe-b"}">${qrSvg(scanUrl)}<div><a href="/admin/students/${s.id}/estamara${langQs}"><strong>${escapeHtml(s.name)}</strong></a><br><small>${escapeHtml(s.class || "")}</small>
          <div class="pending-actions">
            ${waHref ? `<a href="${waHref}" target="_blank"><button type="button" class="wa-btn">📤 واتساب</button></a>` : ""}
          </div>
        </div></div>`;
      }).join("") || `<p class="empty">${t.empty}</p>`;
      const form = `<form method="POST" action="/admin/students${langQs}">
        <label>${t.addName}</label>
        <input name="name" placeholder="${t.addNamePh}" required>
        <label>${t.addClass}</label>
        <input name="class" placeholder="${t.addClassPh}">
        <button type="submit">${t.addSubmit}</button>
      </form>`;
      const regLink = `<div class="reg-link">${t.regLink}<br><a href="${url.origin}/register">${url.origin}/register</a></div>`;
      return new Response(page(t.title, regLink + pendingCards + form + cards, { lang, toggleHref: toggleHref(url, lang), isOwner: roleAllowed(staffRole, ["owner"]) }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    const DASH_I18N = {
      ar: {
        title: "لوحة التحكم",
        totalStudents: "إجمالي الطلاب", pending: "بانتظار المعالجة",
        today: "حضور النهاردة", revenue: "إجمالي قيمة الحجوزات",
        attendanceTitle: "تسجيل الحضور", attendanceStudents: "الطلاب / التسجيلات",
        attendanceToday: "حضور اليوم", attendancePrint: "🖨️ كشف ورقي",
        estamaratTitle: "الاستمارات", estamaratAll: "كل الاستمارات", promos: "📢 العروض",
        guideTitle: "محتاج مساعدة؟", guideLink: "📖 دليل الموظفين"
      },
      en: {
        title: "Dashboard",
        totalStudents: "Total students", pending: "Pending processing",
        today: "Today's attendance", revenue: "Total reservation value",
        attendanceTitle: "Attendance", attendanceStudents: "Students / registrations",
        attendanceToday: "Today's attendance", attendancePrint: "🖨️ Print sheet",
        estamaratTitle: "Applications", estamaratAll: "All applications", promos: "📢 Promotions",
        guideTitle: "Need help?", guideLink: "📖 Staff Guide"
      }
    };
    if (url.pathname === "/admin/dashboard" && request.method === "GET") {
      const lang = langOf(url);
      const t = DASH_I18N[lang];
      const langQs = lang === "en" ? "?lang=en" : "";
      const [totalStudents, pending, today, revenue] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS n FROM students").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM students WHERE status = 'pending'").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE date(scanned_at) = date('now')").first(),
        env.DB.prepare("SELECT COALESCE(SUM(amount), 0) AS n FROM bookings").first()
      ]);
      const tile = (num, label) => `<div class="stat-tile"><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div>`;
      const body = `
      <div class="stat-tiles">
        ${tile(totalStudents.n, t.totalStudents)}
        ${tile(pending.n, t.pending)}
        ${tile(today.n, t.today)}
        ${tile(revenue.n, t.revenue)}
      </div>
      <div class="dash-sections">
        <div class="dash-card">
          <h2>${t.attendanceTitle}</h2>
          <div class="dash-links">
            <a href="/admin${langQs}">${t.attendanceStudents}</a>
            <a href="/admin/today${langQs}">${t.attendanceToday}</a>
            <a href="/admin/print">${t.attendancePrint}</a>
          </div>
        </div>
        <div class="dash-card">
          <h2>${t.estamaratTitle}</h2>
          <div class="dash-links">
            <a href="/admin/estamarat${langQs}">${t.estamaratAll}</a>
            <a href="/admin/promotions${langQs}">${t.promos}</a>
          </div>
        </div>
        <div class="dash-card">
          <h2>${t.guideTitle}</h2>
          <div class="dash-links"><a href="/admin/guide">${t.guideLink}</a></div>
        </div>
      </div>`;
      return new Response(page(t.title, body, { lang, toggleHref: toggleHref(url, lang) }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }


    if (url.pathname === "/admin/students" && request.method === "POST") {
      const lang = langOf(url);
      const langQs = lang === "en" ? "?lang=en" : "";
      const form = await request.formData();
      const name = (form.get("name") || "").toString().trim();
      const stage = sanitizeStage((form.get("stage") || "").toString().trim());
      if (!name) return Response.redirect(url.origin + "/admin" + langQs, 303);
      // Walk-in fast path (2026-07-14): a student standing at the counter right
      // now shouldn't need staff to add them, THEN go find them in the pending
      // list, THEN click "معالجة" — land straight on their process form instead.
      // Stage is picked from the same whitelisted STAGES pool as /register and
      // the process form (2026-07-14: was a free-text "class" field a staff
      // member could mistype; the process page already prefers student.stage
      // over student.class, so this also gets the picked stage pre-selected
      // there instead of just falling back to an unmatched free-text string).
      const { meta } = await env.DB.prepare("INSERT INTO students (name, stage, status) VALUES (?, ?, 'pending')").bind(name, stage).run();
      return Response.redirect(url.origin + `/admin/students/${meta.last_row_id}/process` + langQs, 303);
    }

    const INSTAPAY_NUMBER = "01001750448";
    const VF_CASH_NUMBER = "01004632993";

    const PROCESS_I18N = {
      ar: {
        title: "معالجة تسجيل الطالب",
        name: "اسم الطالب", school: "اسم المدرسة", stage: "الصف الدراسي", track: "المسار",
        phone: "رقم الموبايل", email: "البريد الإلكتروني", subjects: "المواد",
        payment: "طريقة الدفع",
        submit: "تم الدفع - إصدار QR",
        notFound: "الطالب غير موجود.",
        errTitle: "خطأ", errParentPhone: "رقم ولي الأمر لازم يكون مختلف عن رقم الطالب."
      },
      en: {
        title: "Process Student Registration",
        name: "Student name", school: "School name", stage: "Grade", track: "Track",
        phone: "Mobile number", email: "Email", subjects: "Subjects",
        payment: "Payment method",
        submit: "Payment received - issue QR",
        notFound: "Student not found.",
        errTitle: "Error", errParentPhone: "The parent's number must be different from the student's number."
      }
    };

    const processMatch = url.pathname.match(/^\/admin\/students\/(\d+)\/process$/);
    if (processMatch && request.method === "GET") {
      const lang = langOf(url);
      const t = PROCESS_I18N[lang];
      const langQs = lang === "en" ? "?lang=en" : "";
      const student = await env.DB.prepare(
        "SELECT id, name, class, school, stage, track, phone, email, subjects, photo, photo_type, parent_phone, father_phone, mother_phone, home_phone, address FROM students WHERE id = ?"
      ).bind(processMatch[1]).first();
      if (!student) {
        return new Response(page(t.notFound, `<p class="empty">${t.notFound}</p>`, { isOwner: roleAllowed(staffRole, ["owner"]) }), { status: 404, headers: { "content-type": "text/html;charset=utf-8" } });
      }
      const photoImg = student.photo
        ? `<img class="pending-photo" style="width:120px;height:120px;margin-bottom:16px" src="data:${student.photo_type || "image/jpeg"};base64,${bytesToBase64(student.photo)}">`
        : "";
      const stageVal = student.stage || student.class || "";
      const payOptions = Object.entries(PAYMENT_METHODS).map(([key, label]) => {
        const hint = key === "instapay" ? INSTAPAY_NUMBER : key === "vodafone_cash" ? VF_CASH_NUMBER : "";
        return `<label class="pay-option"><input type="radio" name="payment_method" value="${key}" required> ${lang === "en" ? label.en : label.ar}${hint ? `<span class="pay-hint">${hint}</span>` : ""}</label>`;
      }).join("");
      const teachersBySubject = await getTeachersForSubjects(env, student.subjects);
      const promos = await getActivePromotions(env, student.subjects);
      const bookings = await getBookings(env, student.id);
      const activeGroups = await getGroupsWithSeats(env, { activeOnly: true });
      const refPanel = teacherRefPanel(lang, student.subjects, teachersBySubject, promos, stageVal, bookings);
      const body = `${photoImg}${refPanel}<form method="POST" action="/admin/students/${student.id}/process${langQs}">
        <label>${t.name}</label>
        <input name="name" value="${escapeHtml(student.name || "")}" required>
        <label>${t.school}</label>
        <input name="school" value="${escapeHtml(student.school || "")}">
        <label>${t.stage}</label>
        <div class="subjects-grid">${stageRadios(lang, stageVal)}</div>
        <label>${t.track}</label>
        <div class="subjects-grid">${trackRadios(lang, student.track || "")}</div>
        <label>${t.phone}</label>
        <input name="phone" type="tel" value="${escapeHtml(student.phone || "")}" required>
        ${parentPhoneField(lang, student.parent_phone)}
        ${contactFields(lang, student)}
        <label>${t.email}</label>
        <input name="email" type="email" value="${escapeHtml(student.email || "")}">
        <label>${t.subjects}</label>
        <div class="subjects-grid">${subjectsCheckboxes(lang, student.subjects)}</div>
        <label>${t.payment}</label>
        <div class="pay-options">${payOptions}</div>
        ${bookingRowsWidget(lang, student.subjects, bookings, teachersBySubject, activeGroups)}
        <button type="submit">${t.submit}</button>
      </form>`;
      return new Response(page(t.title, body, { lang, toggleHref: toggleHref(url, lang), isOwner: roleAllowed(staffRole, ["owner"]) }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    if (processMatch && request.method === "POST") {
      const lang = langOf(url);
      const t = PROCESS_I18N[lang];
      const form = await request.formData();
      const name = (form.get("name") || "").toString().trim();
      const school = (form.get("school") || "").toString().trim();
      const stage = sanitizeStage((form.get("stage") || "").toString().trim());
      const track = sanitizeTrack((form.get("track") || "").toString().trim());
      const phone = (form.get("phone") || "").toString().trim();
      const email = (form.get("email") || "").toString().trim();
      const subjects = sanitizeSubjects(form.getAll("subjects"));
      const paymentMethod = (form.get("payment_method") || "").toString().trim();
      const parentPhone = (form.get("parent_phone") || "").toString().trim();
      const fatherPhone = (form.get("father_phone") || "").toString().trim();
      const motherPhone = (form.get("mother_phone") || "").toString().trim();
      const homePhone = (form.get("home_phone") || "").toString().trim();
      const address = (form.get("address") || "").toString().trim();
      const bookingRows = parseBookingRows(form);
      if (!phone || !parentPhone || parentPhone === phone) {
        return new Response(page(t.errTitle, `<p class="empty">${t.errParentPhone}</p>`, { lang, isOwner: roleAllowed(staffRole, ["owner"]) }), { status: 400, headers: { "content-type": "text/html;charset=utf-8" } });
      }
      await env.DB.prepare(
        `UPDATE students SET name = ?, school = ?, stage = ?, class = ?, track = ?, phone = ?, email = ?, subjects = ?, payment_method = ?, parent_phone = ?, father_phone = ?, mother_phone = ?, home_phone = ?, address = ?, status = 'approved' WHERE id = ?`
      ).bind(name, school, stage, stage, track, phone, email, subjects, paymentMethod, parentPhone, fatherPhone, motherPhone, homePhone, address, processMatch[1]).run();
      // Re-processing an already-processed estamara replaces its *active* booking
      // rows wholesale rather than trying to diff/merge them — idempotent by design.
      // Scoped to status='active' so a student's dropped-booking history (see
      // /admin/bookings/:id/drop) survives being re-processed. Batched (not looped
      // .run() calls) so the delete + inserts commit as one unit — a partial write
      // here would silently drop the estamara's total.
      await env.DB.batch([
        env.DB.prepare("DELETE FROM bookings WHERE student_id = ? AND status = 'active'").bind(processMatch[1]),
        ...bookingRows.map(b =>
          env.DB.prepare("INSERT INTO bookings (student_id, subject, teacher_name, schedule, amount, group_id) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(processMatch[1], b.subject, b.teacher_name, b.schedule, b.amount, b.group_id)
        )
      ]);
      return Response.redirect(url.origin + `/admin/students/${processMatch[1]}/success` + (lang === "en" ? "?lang=en" : ""), 303);
    }

    const SUCCESS_I18N = {
      ar: {
        title: "تم! ✅", heading: "تم التسجيل والدفع بنجاح",
        wa: "📱 ابعت الرابط للطالب", waParent: "👪 ابعت الرابط لولي الأمر", print: "🖨️ اطبع تذكرة الدخول",
        ticketHint: "الطالب يستخدم الكود ده كل يوم للدخول — المدرسة تديه ورقة مطبوعة و/أو رابط واتساب.",
        waText: (name, link) => `أهلاً بيك في هارف يا ${name}! ده رابط بطاقة حضورك، احتفظ بيه وافتحه كل يوم علشان تدخل: ${link}`,
        waParentText: (name, link) => `أهلاً بيكم من هارف! ده رابط متابعة حضور ${name} أول بأول — تقدروا تشوفوا هو حضر النهارده ولا لأ من هنا: ${link}`,
        back: "رجوع للطلاب", estamaraHeading: "استمارتك", linkLabel: "رابط بطاقتك (احفظه):"
      },
      en: {
        title: "Done! ✅", heading: "Registration and payment confirmed",
        wa: "📱 Send link to student", waParent: "👪 Send link to parent", print: "🖨️ Print entry ticket",
        ticketHint: "The student uses this code every day to enter — hand them the printed ticket and/or the WhatsApp link.",
        waText: (name, link) => `Welcome to Harv, ${name}! Here's your attendance card link, keep it and open it daily to check in: ${link}`,
        waParentText: (name, link) => `Hello from Harv! Here's a link to track ${name}'s attendance in real time — you can check whether they attended today here: ${link}`,
        back: "Back to students", estamaraHeading: "Your application", linkLabel: "Your card link (save it):"
      }
    };

    const successMatch = url.pathname.match(/^\/admin\/students\/(\d+)\/success$/);
    if (successMatch && request.method === "GET") {
      const lang = langOf(url);
      const t = SUCCESS_I18N[lang];
      const langQs = lang === "en" ? "?lang=en" : "";
      const student = await env.DB.prepare("SELECT id, name, class, phone, parent_phone, status FROM students WHERE id = ?").bind(successMatch[1]).first();
      if (!student || student.status !== "approved") {
        return Response.redirect(url.origin + "/admin" + langQs, 303);
      }
      const scanUrl = `${url.origin}/scan?student=${student.id}`;
      const studentPageUrl = `${url.origin}/student?id=${student.id}`;
      const waHref = student.phone ? waLink(student.phone, t.waText(student.name, studentPageUrl)) : null;
      const hasSeparateParent = student.parent_phone && student.parent_phone !== student.phone;
      const waParentHref = hasSeparateParent ? waLink(student.parent_phone, t.waParentText(student.name, studentPageUrl)) : null;
      const bookings = await getBookings(env, student.id);
      const body = `
<div class="confirm" style="margin-bottom:20px"><strong>${t.heading}</strong>${escapeHtml(student.name)}</div>
<div class="handoff-actions no-print">
  ${waHref ? `<a href="${waHref}" target="_blank"><button class="wa-btn">${t.wa}</button></a>` : ""}
  ${waParentHref ? `<a href="${waParentHref}" target="_blank"><button class="wa-btn">${t.waParent}</button></a>` : ""}
  <button onclick="window.print()">${t.print}</button>
</div>
<div class="print-ticket">
  ${LOGO_B64 ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Harv" style="height:40px;margin:0 auto 12px;display:block">` : ""}
  <div class="pt-name">${escapeHtml(student.name)}</div>
  ${student.class ? `<div class="pt-class">${escapeHtml(student.class)}</div>` : ""}
  ${qrSvg(scanUrl)}
  <p class="pt-hint">${t.ticketHint}</p>
  ${bookings.length ? `<h2 style="font-size:17px;margin:16px 0 10px">${t.estamaraHeading}</h2>${bookingTableHtml(lang, bookings)}` : ""}
</div>
<div class="reg-link no-print">${t.linkLabel}<br><a href="${studentPageUrl}">${studentPageUrl}</a></div>
<p class="no-print"><a href="/admin${langQs}">${t.back}</a></p>`;
      return new Response(page(t.title, body, { nav: false, lang }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    const ESTAMARAT_I18N = {
      ar: {
        title: "الاستمارات", count: "استمارة", grandTotal: "إجمالي كل الحجوزات",
        pendingBadge: "بانتظار المعالجة", track: "المسار", subjectsCount: "عدد المواد",
        total: "الإجمالي", view: "عرض", empty: "لا يوجد طلاب مسجلين بعد."
      },
      en: {
        title: "Applications", count: "applications", grandTotal: "Grand total across all bookings",
        pendingBadge: "Pending", track: "Track", subjectsCount: "Subjects",
        total: "Total", view: "View", empty: "No students registered yet."
      }
    };

    if (url.pathname === "/admin/estamarat" && request.method === "GET") {
      const lang = langOf(url);
      const t = ESTAMARAT_I18N[lang];
      const langQs = lang === "en" ? "?lang=en" : "";
      const { results } = await env.DB.prepare(
        `SELECT s.id, s.name, s.stage, s.track, s.status, s.subjects,
                COALESCE(SUM(b.amount), 0) AS total
         FROM students s LEFT JOIN bookings b ON b.student_id = s.id
         GROUP BY s.id ORDER BY (s.status = 'pending') DESC, s.name`
      ).all();
      const grandTotal = results.reduce((sum, r) => sum + r.total, 0);
      const trackLabel = v => (TRACKS.find(tr => tr.v === v) || {})[lang] || v || "";
      const rows = results.map((r, i) => {
        const subjectCount = (r.subjects || "").split(",").filter(Boolean).length;
        return `<div class="card ${i % 2 === 0 ? "stripe-a" : "stripe-b"}">
          <div>
            ${r.status === "pending" ? `<span class="badge-pending">${t.pendingBadge}</span><br>` : ""}
            <strong>${escapeHtml(r.name)}</strong><br>
            <small>${[r.stage, trackLabel(r.track)].filter(Boolean).map(escapeHtml).join(" · ")} · ${subjectCount} ${t.subjectsCount}</small><br>
            <small>${t.total}: <strong>${r.total.toFixed(2)}</strong></small>
            <div class="pending-actions">
              <a href="/admin/students/${r.id}/estamara${langQs}"><button type="button">${t.view}</button></a>
            </div>
          </div>
        </div>`;
      }).join("") || `<p class="empty">${t.empty}</p>`;
      const summary = `<p>${results.length} ${t.count} · ${t.grandTotal}: <strong>${grandTotal.toFixed(2)}</strong></p>`;
      return new Response(page(t.title, summary + rows, { lang, toggleHref: toggleHref(url, lang), isOwner: roleAllowed(staffRole, ["owner"]) }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    // Serves the raw stored photo bytes standalone, so the counter kiosk's scan
    // confirmation (and anything else that just needs a small identity thumbnail)
    // can reference an <img src> instead of every scan JSON response embedding a
    // full base64 blob — a scan already fires often; keep that payload small.
    // Deliberately not owner-gated (claude-review, PR #8, asked to confirm this
    // wasn't an oversight): balance/payment recording here is a single
    // student's day-to-day front-desk transaction, not a business-wide
    // financial view — clerk needs this to actually collect payment at
    // registration. Owner-only stays scoped to room/group pricing setup, the
    // ledger, teacher payouts, and staff management (see /admin/owner).
    const estamaraMatch = url.pathname.match(/^\/admin\/students\/(\d+)\/estamara$/);
    if (estamaraMatch && request.method === "GET") {
      const lang = langOf(url);
      const t = ESTAMARA_I18N[lang];
      const student = await env.DB.prepare(
        `SELECT id, name, school, stage, track, phone, parent_phone, father_phone, mother_phone, home_phone, address
         FROM students WHERE id = ?`
      ).bind(estamaraMatch[1]).first();
      if (!student) {
        return new Response(page(t.notFound, `<p class="empty">${t.notFound}</p>`, { isOwner: roleAllowed(staffRole, ["owner"]) }), { status: 404, headers: { "content-type": "text/html;charset=utf-8" } });
      }
      const bookings = await getBookings(env, student.id);
      const dropped = await getDroppedBookings(env, student.id);
      const balance = await getStudentBalance(env, student.id);
      const payments = await getPayments(env, student.id);
      const langQs = lang === "en" ? "?lang=en" : "";
      const trackLabel = (TRACKS.find(tr => tr.v === student.track) || {})[lang] || "";
      const infoRow = (label, value) => value ? `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>` : "";
      const studentPageUrl = `${url.origin}/student?id=${student.id}`;
      const stU = SUCCESS_I18N[lang];
      const waStudentHref = student.phone ? waLink(student.phone, stU.waText(student.name, studentPageUrl)) : null;
      const hasSeparateParent = student.parent_phone && student.parent_phone !== student.phone;
      const waParentHref = hasSeparateParent ? waLink(student.parent_phone, stU.waParentText(student.name, studentPageUrl)) : null;
      const shareButtons = `
      <div class="handoff-actions no-print">
        ${waStudentHref ? `<a href="${waStudentHref}" target="_blank"><button class="wa-btn">${stU.wa}</button></a>` : ""}
        ${waParentHref ? `<a href="${waParentHref}" target="_blank"><button class="wa-btn">${stU.waParent}</button></a>` : ""}
      </div>
      <div class="reg-link no-print">${lang === "en" ? "Student's own link:" : "رابط الطالب الخاص بيه:"}<br><a href="${studentPageUrl}">${studentPageUrl}</a></div>`;
      const body = `
      <div class="estamara-header no-print"><button onclick="window.print()">${t.print}</button></div>
      ${shareButtons}
      ${infoRow(t.name, student.name)}
      ${infoRow(t.school, student.school)}
      ${infoRow(t.stage, student.stage)}
      ${infoRow(t.track, trackLabel)}
      ${infoRow(t.phone, student.phone)}
      ${infoRow(t.parentPhone, student.parent_phone)}
      ${infoRow(t.fatherPhone, student.father_phone)}
      ${infoRow(t.motherPhone, student.mother_phone)}
      ${infoRow(t.homePhone, student.home_phone)}
      ${infoRow(t.address, student.address)}
      ${bookingTableHtml(lang, bookings, { langQs })}
      ${balanceSummaryHtml(lang, balance)}
      ${paymentFormHtml(lang, student.id, langQs)}
      ${paymentsHistoryHtml(lang, payments)}
      ${droppedBookingsHtml(lang, dropped)}`;
      return new Response(page(escapeHtml(student.name), body, { nav: false, lang }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    // Drop a booking (mirrors the old CenterStudent app's deleted_from_group table,
    // e.g. "حذف لتكرار الغياب" = dropped for repeated absence). Kept as a row with
    // status='dropped', not deleted, so it still shows in getDroppedBookings().
    // A transfer is just a drop + a fresh booking picked on the process page.
    if (url.pathname === "/admin/promotions" && request.method === "GET") {
      const lang = langOf(url);
      const t = PROMO_I18N[lang];
      const langQs = lang === "en" ? "?lang=en" : "";
      const { results } = await env.DB.prepare("SELECT id, subject, teacher_name, text, active FROM promotions ORDER BY active DESC, id DESC").all();
      const rows = results.map(p => {
        const subjLabel = p.subject ? subjectsDisplay(lang, p.subject) : t.subjectAny;
        return `<div class="card ${p.active ? "" : "stripe-b"}">
          <div>
            ${!p.active ? `<span class="badge-pending" style="background:#8A93A6">${t.inactive}</span><br>` : ""}
            <strong>${p.teacher_name ? p.teacher_name + " — " : ""}${subjLabel}</strong><br>
            <small>${p.text}</small>
            <div class="pending-actions">
              <form method="POST" action="/admin/promotions/${p.id}/toggle${langQs}"><button type="submit" class="${p.active ? "btn-reject" : ""}">${p.active ? t.deactivate : t.activate}</button></form>
            </div>
          </div>
        </div>`;
      }).join("") || `<p class="empty">${t.empty}</p>`;
      const subjectOptions = SUBJECTS.map(s => `<option value="${s.v}">${lang === "en" ? s.en : s.ar}</option>`).join("");
      const form = `<form method="POST" action="/admin/promotions${langQs}">
        <label>${t.subject}</label>
        <select name="subject"><option value="">${t.subjectAny}</option>${subjectOptions}</select>
        <label>${t.teacher}</label>
        <input name="teacher_name">
        <label>${t.text}</label>
        <input name="text" required>
        <button type="submit">${t.add}</button>
      </form>`;
      return new Response(page(t.title, form + rows, { lang, toggleHref: toggleHref(url, lang), isOwner: roleAllowed(staffRole, ["owner"]) }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    if (url.pathname === "/admin/promotions" && request.method === "POST") {
      const lang = langOf(url);
      const form = await request.formData();
      const subject = (form.get("subject") || "").toString().trim() || null;
      const teacherName = (form.get("teacher_name") || "").toString().trim() || null;
      const text = (form.get("text") || "").toString().trim();
      if (text) {
        await env.DB.prepare("INSERT INTO promotions (subject, teacher_name, text) VALUES (?, ?, ?)").bind(subject, teacherName, text).run();
      }
      return Response.redirect(url.origin + "/admin/promotions" + (lang === "en" ? "?lang=en" : ""), 303);
    }

    const promoToggleMatch = url.pathname.match(/^\/admin\/promotions\/(\d+)\/toggle$/);
    if (promoToggleMatch && request.method === "POST") {
      const lang = langOf(url);
      await env.DB.prepare("UPDATE promotions SET active = 1 - active WHERE id = ?").bind(promoToggleMatch[1]).run();
      return Response.redirect(url.origin + "/admin/promotions" + (lang === "en" ? "?lang=en" : ""), 303);
    }

    const ROOMS_I18N = {
      ar: {
        title: "القاعات", name: "اسم القاعة", namePh: "مثلاً: قاعة 1", floor: "الدور", floorPh: "مثلاً: الدور الأول",
        capacity: "السعة", capacityPh: "عدد الطلاب", add: "إضافة قاعة", empty: "لا يوجد قاعات بعد."
      },
      en: {
        title: "Rooms", name: "Room name", namePh: "e.g. Room 1", floor: "Floor", floorPh: "e.g. 1st floor",
        capacity: "Capacity", capacityPh: "number of students", add: "Add room", empty: "No rooms yet."
      }
    };

    async function getRooms(env) {
      const { results } = await env.DB.prepare("SELECT id, name, floor, capacity FROM rooms ORDER BY name").all();
      return results;
    }

    // Enrolled = active bookings currently attached to the group, computed live
    // (not stored) so it's always accurate against the bookings table.
    async function getGroupsWithSeats(env, { activeOnly = false } = {}) {
      const { results } = await env.DB.prepare(
        `SELECT g.id, g.teacher_id, g.teacher_name, g.subject, g.stage, g.day, g.time, g.price, g.active,
                r.name AS room_name, g.capacity,
                (SELECT COUNT(*) FROM bookings b WHERE b.group_id = g.id AND b.status = 'active') AS enrolled
         FROM groups g LEFT JOIN rooms r ON r.id = g.room_id
         ${activeOnly ? "WHERE g.active = 1" : ""}
         ORDER BY g.active DESC, g.subject, g.day, g.time`
      ).all();
      return results;
    }
    const rejectMatch = url.pathname.match(/^\/admin\/students\/(\d+)\/reject$/);
    if (rejectMatch && request.method === "POST") {
      const lang = langOf(url);
      await env.DB.prepare("DELETE FROM students WHERE id = ? AND status = 'pending'").bind(rejectMatch[1]).run();
      return Response.redirect(url.origin + "/admin" + (lang === "en" ? "?lang=en" : ""), 303);
    }

    const REGISTER_I18N = {
      ar: {
        title: "تسجيل بيانات الطالب",
        name: "اسم الطالب", namePh: "اكتب اسمك بالكامل",
        school: "اسم المدرسة", schoolPh: "اكتب اسم مدرستك",
        stage: "الصف الدراسي",
        track: "المسار",
        phone: "رقم الموبايل", phonePh: "01xxxxxxxxx",
        email: "البريد الإلكتروني", emailPh: "اختياري",
        photo: "صورة شخصية (اختياري)",
        subjects: "المواد اللي عايزها",
        submit: "تسجيل",
        thanksTitle: "تم التسجيل", thanks: "شكراً!", thanksBody: "هيتم مراجعة بياناتك من فريق هارف قريباً.",
        errTitle: "خطأ", err: "من فضلك املأ الاسم والصف الدراسي.",
        errParentPhone: "من فضلك اكتب رقمك ورقم ولي الأمر، ولازم يكونوا مختلفين عن بعض."
      },
      en: {
        title: "Student Registration",
        name: "Student name", namePh: "Enter your full name",
        school: "School name", schoolPh: "Enter your school name",
        stage: "Grade",
        track: "Track",
        phone: "Mobile number", phonePh: "01xxxxxxxxx",
        email: "Email", emailPh: "optional",
        photo: "Photo (optional)",
        subjects: "Subjects you want",
        submit: "Register",
        thanksTitle: "Registered", thanks: "Thanks!", thanksBody: "Our team will review your info soon.",
        errTitle: "Error", err: "Please fill in your name and grade.",
        errParentPhone: "Please fill in both your number and a parent number, and they must be different."
      }
    };

    if (url.pathname === "/register" && request.method === "GET") {
      const lang = langOf(url);
      const t = REGISTER_I18N[lang];
      const langQs = lang === "en" ? "?lang=en" : "";
      const teachersBySubject = await getAllTeachersGrouped(env);
      const teacherHeading = lang === "en" ? "👨‍🏫 Teachers for the subjects you picked" : "👨‍🏫 مدرسين المواد اللي اخترتها";
      const body = `<form method="POST" action="/register${langQs}" enctype="multipart/form-data">
        <label>${t.name}</label>
        <input name="name" placeholder="${t.namePh}" required>
        <label>${t.school}</label>
        <input name="school" placeholder="${t.schoolPh}">
        <label>${t.stage}</label>
        <div class="subjects-grid">${stageRadios(lang)}</div>
        <label>${t.track}</label>
        <div class="subjects-grid">${trackRadios(lang, "")}</div>
        <label>${t.phone}</label>
        <input name="phone" type="tel" placeholder="${t.phonePh}" required>
        ${parentPhoneField(lang, "")}
        ${contactFields(lang)}
        <label>${t.email}</label>
        <input name="email" type="email" placeholder="${t.emailPh}">
        <label>${t.subjects}</label>
        <div class="subjects-grid">${subjectsCheckboxes(lang)}</div>
        <div class="teacher-ref-panel" id="subject-teachers" hidden>
          <h2 style="font-size:17px;margin:0 0 10px">${teacherHeading}</h2>
          ${subjectTeacherBlocks(lang, teachersBySubject)}
        </div>
        <label>${t.photo}</label>
        <input name="photo" type="file" accept="image/*" capture="environment">
        <input name="website" style="display:none" tabindex="-1" autocomplete="off">
        <button type="submit">${t.submit}</button>
      </form>
      <script>
      (function(){
        var panel = document.getElementById("subject-teachers");
        var boxes = document.querySelectorAll('input[name="subjects"]');
        function sync(){
          var anyVisible = false;
          boxes.forEach(function(cb){
            var block = document.querySelector('[data-subject-block="' + cb.value + '"]');
            if (!block) return;
            block.hidden = !cb.checked;
            if (cb.checked) anyVisible = true;
          });
          panel.hidden = !anyVisible;
        }
        boxes.forEach(function(cb){ cb.addEventListener("change", sync); });
      })();
      </script>`;
      return new Response(page(t.title, body, { nav: false, lang, toggleHref: toggleHref(url, lang) }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    if (url.pathname === "/register" && request.method === "POST") {
      const lang = langOf(url);
      const t = REGISTER_I18N[lang];
      const form = await request.formData();
      if ((form.get("website") || "").toString().trim()) {
        return new Response(page(t.thanksTitle, `<div class="confirm"><strong>${t.thanks}</strong>${t.thanksBody}</div>`, { nav: false, lang }), { headers: { "content-type": "text/html;charset=utf-8" } });
      }
      const name = (form.get("name") || "").toString().trim();
      const stage = sanitizeStage((form.get("stage") || "").toString().trim());
      if (!name || !stage) {
        return new Response(page(t.errTitle, `<p class="empty">${t.err}</p>`, { nav: false, lang }), { status: 400, headers: { "content-type": "text/html;charset=utf-8" } });
      }
      const school = (form.get("school") || "").toString().trim();
      const phone = (form.get("phone") || "").toString().trim();
      const email = (form.get("email") || "").toString().trim();
      const subjects = sanitizeSubjects(form.getAll("subjects"));
      const parentPhone = (form.get("parent_phone") || "").toString().trim();
      const track = sanitizeTrack((form.get("track") || "").toString().trim());
      const fatherPhone = (form.get("father_phone") || "").toString().trim();
      const motherPhone = (form.get("mother_phone") || "").toString().trim();
      const homePhone = (form.get("home_phone") || "").toString().trim();
      const address = (form.get("address") || "").toString().trim();
      if (!phone || !parentPhone || parentPhone === phone) {
        return new Response(page(t.errTitle, `<p class="empty">${t.errParentPhone}</p>`, { nav: false, lang }), { status: 400, headers: { "content-type": "text/html;charset=utf-8" } });
      }
      const photoFile = form.get("photo");
      let photoBuf = null, photoType = null;
      if (photoFile && typeof photoFile === "object" && photoFile.size > 0) {
        photoBuf = await photoFile.arrayBuffer();
        photoType = photoFile.type || "image/jpeg";
      }
      const inserted = await env.DB.prepare(
        `INSERT INTO students (name, class, school, stage, phone, email, subjects, parent_phone, track, father_phone, mother_phone, home_phone, address, photo, photo_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
      ).bind(name, stage, school, stage, phone, email, subjects, parentPhone, track, fatherPhone, motherPhone, homePhone, address, photoBuf, photoType).run();
      // If the student picked a specific teacher per subject (pick_<slug> radios
      // from subjectTeacherBlocks()), seed the bookings table with those picks
      // now — amount stays 0 until the clerk confirms the fee at
      // /admin/students/:id/process, whose bookingRowsWidget() already pre-seeds
      // rows from getBookings(), so no widget-side change was needed to surface this.
      const pickedSlugs = subjects.split(",").map(s => s.trim()).filter(Boolean);
      const pickedIds = pickedSlugs
        .map(slug => ({ slug, id: (form.get(`pick_${slug}`) || "").toString().trim() }))
        .filter(p => p.id);
      if (pickedIds.length) {
        const placeholders = pickedIds.map(() => "?").join(",");
        const { results: pickedTeachers } = await env.DB.prepare(
          `SELECT id, name, schedule FROM teachers WHERE id IN (${placeholders})`
        ).bind(...pickedIds.map(p => p.id)).all();
        const teacherById = new Map(pickedTeachers.map(row => [row.id, row]));
        const bookingStmts = pickedIds
          .map(p => ({ slug: p.slug, row: teacherById.get(p.id) }))
          .filter(p => p.row)
          .map(p => env.DB.prepare(
            "INSERT INTO bookings (student_id, subject, teacher_name, schedule, amount) VALUES (?, ?, ?, ?, 0)"
          ).bind(inserted.meta.last_row_id, p.slug, p.row.name, p.row.schedule || ""));
        if (bookingStmts.length) await env.DB.batch(bookingStmts);
      }
      return new Response(page(t.thanksTitle, `<div class="confirm"><strong>${t.thanks}</strong>${t.thanksBody}</div>`, { nav: false, lang }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    if (url.pathname === "/scan" && request.method === "GET") {
      const studentId = url.searchParams.get("student");
      const groupParam = parseInt(url.searchParams.get("group") || "", 10);
      const r = await markAttendance(env, studentId, Number.isFinite(groupParam) ? groupParam : null);
      if (r.result === "not_found") {
        return new Response(page("لم يتم العثور على الطالب", `<p class="empty">كود QR غير معروف.</p>`, { nav: false }), { status: 404, headers: { "content-type": "text/html;charset=utf-8" } });
      }
      if (r.result === "pending") {
        return new Response(page("التسجيل لسه معلّق", `<div class="confirm"><strong>${escapeHtml(r.name)}</strong>التسجيل أو الدفع لسه متأكدش — روح للاستقبال.</div>`, { nav: false }), { status: 403, headers: { "content-type": "text/html;charset=utf-8" } });
      }
      if (r.result === "invalid_group") {
        return new Response(page("المجموعة دي مش متاحة", `<div class="confirm"><strong>${escapeHtml(r.name)}</strong>المجموعة دي مش متاحة للمسح دلوقتي — روح للاستقبال.</div>`, { nav: false }), { status: 403, headers: { "content-type": "text/html;charset=utf-8" } });
      }
      const body = r.result === "marked"
        ? `<div class="confirm"><strong>${escapeHtml(r.name)}</strong>تم تسجيل الحضور الساعة ${new Date().toLocaleTimeString("ar-EG")}</div>`
        : `<div class="confirm"><strong>${escapeHtml(r.name)}</strong>تم تسجيل حضورك بالفعل اليوم</div>`;
      return new Response(page("تم تسجيل الحضور", body, { nav: false }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    // Backs both /scan (phone-camera page load) and /admin/counter (hardware
    // USB scanner at the front-desk laptop, via /admin/scan-mark below) — one
    // place for the lookup + approval-gate + dedup insert so both flows can
    // never drift on the actual attendance-marking rule.
    if (url.pathname === "/admin/today" && request.method === "GET") {
      // room_name surfaces which of the (potentially several concurrent)
      // lecture halls each scan belongs to — this view flattens every group
      // together by time, so with 4 halls possibly running at once it's the
      // one place room ambiguity would otherwise bite hardest.
      const { results } = await env.DB.prepare(
        `SELECT s.id, s.name, a.scanned_at, r.name AS room_name FROM attendance a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN groups g ON g.id = a.group_id
         LEFT JOIN rooms r ON r.id = g.room_id
         WHERE date(a.scanned_at) = date('now')
         ORDER BY a.scanned_at DESC`
      ).all();
      const rows = results.map((r, i) => `<div class="card ${i % 2 === 0 ? "stripe-a" : "stripe-b"}"><div><a href="/admin/students/${r.id}/estamara"><strong>${escapeHtml(r.name)}</strong></a><br><small>${r.scanned_at}${r.room_name ? ` · 🚪 ${escapeHtml(r.room_name)}` : ""}</small></div></div>`).join("") || `<p class="empty">لا يوجد تسجيل حضور اليوم.</p>`;
      return new Response(page("حضور اليوم", rows, { isOwner: roleAllowed(staffRole, ["owner"]) }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    const ATTENDANCE_I18N = {
      ar: { title: "كشف الحضور", present: "حاضر", absent: "غايب", pickGroup: "اختار مجموعة", empty: "المجموعة دي لسه مفيهاش طلاب." },
      en: { title: "Attendance Report", present: "Present", absent: "Absent", pickGroup: "Pick a group", empty: "This group has no students yet." }
    };

    // Per-group, per-date view: enrolled (active bookings on this group) crossed
    // with who actually scanned in on that date — the "who's missing" report the
    // old CenterStudent app never had (it only tracked aggregate session counts).
    if (url.pathname === "/admin/print" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT name, class FROM students ORDER BY name").all();
      const rows = results.map((s, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.class || "")}</td><td></td><td></td><td></td><td><span class="roster-box"></span></td></tr>`).join("")
        || `<tr><td colspan="7">لا يوجد طلاب مسجلين بعد.</td></tr>`;
      const body = `
<p class="no-print"><button onclick="window.print()">🖨️ اطبع الكشف</button></p>
<p>كشف حضور ورقي — احتياطي في حالة تعطل التطبيق أو الإنترنت</p>
<p>التاريخ: ______________________</p>
<table class="roster-table">
<thead><tr><th>#</th><th>اسم الطالب</th><th>الصف</th><th>المادة</th><th>المدرس</th><th>وقت الحضور</th><th>حضور</th></tr></thead>
<tbody>${rows}</tbody>
</table>`;
      return new Response(page("كشف ورقي", body, { isOwner: roleAllowed(staffRole, ["owner"]) }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    // ponytail: Arabic-only by design (agreed with Hazem) — this is the printed
    // staff one-pager, not a dual-language admin screen. In-app contextual help
    // (short hint banners on the dashboard/process pages) is a planned follow-up,
    // not built yet — see TO DO.md / HARV_ATTENDANCE_SUPPORT_PLAYBOOK.md.
    // Rewritten 2026-07-14 to match the /council-verdict IA (intake/session/
    // owner) — the old version pre-dated that split and pointed at a "الشاشة
    // الرئيسية" layout that no longer exists. Sectioned with a jump-to table of
    // contents and real <a href> links to every destination it mentions, per
    // Hazem's direct ask ("add hyperlinks to where they should go, so it's less
    // confusing if they're in help"). The "الإدارة" section only renders for an
    // actual owner — no point explaining pages a clerk's account can't open.
    if (url.pathname === "/admin/guide" && request.method === "GET") {
      const isOwnerGuide = roleAllowed(staffRole, ["owner"]);
      const sec = (id, title, bodyHtml) => `<h2 id="${id}" style="font-size:20px;margin:24px 0 10px">${title}</h2>${bodyHtml}`;
      const toc = [
        ["s-intake", "🏠 الشاشة الرئيسية"],
        ["s-newstudent", "🆕 لما طالب جديد ييجي"],
        ["s-session", "▶️ أثناء الحصة"],
        ["s-find", "🔎 البحث عن طالب / تسجيل دفعة"],
        ["s-lost", "❓ لو تهت"],
        ["s-login", "🔐 لو ظهرلك شاشة تسجيل دخول"],
        ...(isOwnerGuide ? [["s-owner", "⚙️ إدارة (مدير بس)"]] : [])
      ];
      const body = `
<p class="no-print"><button onclick="window.print()">🖨️ اطبع الدليل</button></p>
<p>الدليل ده يشرح خطوات الشغل اليومي خطوة بخطوة. دوس على أي عنوان تحت تروح له على طول.</p>
<ul class="no-print" style="line-height:2">
  ${toc.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join("")}
</ul>

${sec("s-intake", "🏠 الشاشة الرئيسية", `
<p>هي أول حاجة بتفتح لك بعد تسجيل الدخول — <a href="/admin/intake">الرئيسية</a>. فيها بس اللي محتاجه دلوقتي:</p>
<ul style="line-height:2">
  <li><strong>بانتظار المعالجة</strong> — الطلاب اللي لسه محتاجين تسجيل بياناتهم ودفع الفلوس.</li>
  <li><strong>الحصص والمجموعات</strong> — روابط لـ <a href="/admin/groups">المجموعات</a>، <a href="/admin/rooms">القاعات</a>، <a href="/admin/estamarat">الاستمارات</a> (كل الطلاب المسجلين وفلوسهم)، و<a href="/admin/promotions">العروض</a>.</li>
  <li>زرار كبير فوق "أثناء الحصة" — دوس عليه لما الطلاب يبقوا جوه الحصة (شوف قسم <a href="#s-session">أثناء الحصة</a>).</li>
</ul>`)}

${sec("s-newstudent", "🆕 لما طالب جديد ييجي", `
<ol style="line-height:2">
  <li>ابعتله رابط التسجيل — <code>/register</code> — يملأه بنفسه من موبايله لو معاه نت.</li>
  <li>لو مفيش نت معاه، افتح <a href="/admin">صفحة الطلاب</a> واكتب اسمه بس في نموذج "إضافة طالب"، وكمل الباقي بعدين.</li>
  <li>هتلاقيه في <a href="/admin">صفحة الطلاب</a> تحت "بانتظار المعالجة" باللون الأحمر (ولينك سريع ليها من <a href="/admin/intake">الرئيسية</a>).</li>
  <li>دوس "معالجة" جنب اسمه.</li>
  <li>اكتب/راجع بياناته، اختار المواد، وحدد اسم الأستاذ والمعاد والمبلغ لكل مادة (الأستاذ بيتفلتر تلقائي حسب المادة).</li>
  <li>اختار طريقة الدفع (كاش / إنستاباي / فودافون كاش).</li>
  <li>دوس زرار "تم الدفع - إصدار QR" — هيظهرلك كود الدخول بتاعه واستمارته كاملة، وتقدر تبعتلها على الواتساب بدوسة واحدة.</li>
</ol>`)}

${sec("s-session", "▶️ أثناء الحصة", `
<p>لما الطلاب يوصلوا ويدخلوا الحصة، روح لـ <a href="/admin/session">أثناء الحصة</a> (زرار كبير في الرئيسية). هتلاقي:</p>
<ul style="line-height:2">
  <li><strong><a href="/admin/today">حضور اليوم</a></strong> — مين حضر النهاردة.</li>
  <li><strong><a href="/admin/counter">سكانر الاستقبال</a></strong> — لو معاك جهاز سكانر QR متوصل بالكمبيوتر، افتح الصفحة دي ووجّه السكانر على كود الطالب، هيتسجل حضوره تلقائي من غير ما تدوس أي حاجة.</li>
  <li><strong><a href="/admin/print">كشف ورقي</a></strong> — احتياطي لو النت وقع، تطبعه وتعلّم عليه بالإيد.</li>
  <li><strong>بحث عن طالب</strong> — لو طالب محتاج يدفع أو تراجع بياناته وهو جوه الحصة (شوف القسم اللي جاي).</li>
</ul>`)}

${sec("s-find", "🔎 البحث عن طالب / تسجيل دفعة", `
<ul style="line-height:2">
  <li>دوس على اسم أي طالب في أي مكان — <a href="/admin">صفحة الطلاب</a>، <a href="/admin/today">حضور اليوم</a>، أو <a href="/admin/estamarat">الاستمارات</a> — هيفتحلك استمارته كاملة.</li>
  <li>من صفحة استمارته تقدر: تشوف المطلوب/المدفوع/المتبقي، تسجل دفعة جديدة، تبعتله رابطه على الواتساب تاني، أو تلغي مادة اشترك فيها غلط.</li>
</ul>`)}

${sec("s-lost", "❓ لو تهت", `
<ul style="line-height:2">
  <li>دوس على شعار هارف فوق في أي وقت، وهيرجعك لـ <a href="/admin/intake">الرئيسية</a> على طول.</li>
  <li>أو دوس "🏠 الرئيسية" في شريط التنقل فوق.</li>
</ul>`)}

${sec("s-login", "🔐 لو ظهرلك شاشة تسجيل دخول", `
<p>ده طبيعي، بيحصل كل شهر تقريبًا. اكتب إيميلك، وهيبعتلك كود من 6 أرقام على نفس الإيميل — افتح الإيميل واكتب الكود.</p>`)}

${isOwnerGuide ? sec("s-owner", "⚙️ إدارة (مدير بس)", `
<p>القسم ده مش ظاهر لموظف الاستقبال العادي — بيظهر بس للمدير. تلاقيه من <a href="/admin/owner">إدارة</a> في شريط التنقل.</p>
<ul style="line-height:2">
  <li><strong><a href="/admin/ledger">دفتر الحساب</a></strong> — كل الفلوس الداخلة والخارجة، وتقدر تسجل مصروف (إيجار، مرتبات، فاتورة تليفون...) من هنا.</li>
  <li><strong><a href="/admin/teachers">الأساتذة</a></strong> — تحدد لكل أستاذ نسبته (بالحصة أو نسبة %)، وتشوف مين محتاج تسوية فلوس دلوقتي في قسم "⚠️ يحتاج متابعة" فوق الصفحة.</li>
  <li><strong><a href="/admin/staff">الموظفين</a></strong> — تضيف موظف جديد وتحدد صلاحيته (مدير / موظف استقبال / مشاهدة فقط).</li>
</ul>`) : ""}`;
      return new Response(page("دليل الموظفين", body, { isOwner: isOwnerGuide }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    if (url.pathname === "/student" && request.method === "GET") {
      const id = url.searchParams.get("id");
      const student = await env.DB.prepare("SELECT id, name, class, subjects, status FROM students WHERE id = ?").bind(id).first();
      if (!student) {
        return new Response(page("لم يتم العثور على الطالب", `<p class="empty">البطاقة دي مش موجودة. اتأكد من الرابط أو ارجع لموظف الاستقبال.</p>`, { nav: false }), { status: 404, headers: { "content-type": "text/html;charset=utf-8" } });
      }
      if (student.status !== "approved") {
        return new Response(page("التسجيل قيد المراجعة", `<div class="confirm"><strong>${escapeHtml(student.name)}</strong>لسه بنراجع بياناتك وتأكيد الدفع. تعالى للاستقبال لو محتاج تكمل الدفع.</div>`, { nav: false }), { headers: { "content-type": "text/html;charset=utf-8" } });
      }
      const bookings = await getBookings(env, student.id);
      // ponytail: app-wide dedup uses UTC date(scanned_at); match it here so status agrees with /scan
      const att = await env.DB.prepare(
        "SELECT strftime('%H:%M', scanned_at, '+3 hours') AS t FROM attendance WHERE student_id = ? AND date(scanned_at) = date('now') LIMIT 1"
      ).bind(student.id).first();
      const scanUrl = `${url.origin}/scan?student=${student.id}`;
      const status = att
        ? `<span class="sc-status sc-yes"><span class="sc-dot"></span>حضرت النهارده · الساعة ${att.t}</span>`
        : `<span class="sc-status sc-no"><span class="sc-dot"></span>لسه ما سجّلتش حضورك النهارده</span>`;
      const body = `<style>
.sc{max-width:400px;margin:8px auto 0}
.sc-card{background:var(--surface);border:1px solid var(--line);border-radius:22px;overflow:hidden;box-shadow:0 10px 34px rgba(26,39,68,.10)}
.sc-band{background:var(--ink);color:#fff;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid var(--red)}
.sc-overline{font-size:13px;font-weight:600;color:#C9D2E4}
.sc-brand{font-size:18px;font-weight:700}
.sc-body{padding:24px 22px 26px;text-align:center}
.sc-name{font-size:30px;font-weight:700;line-height:1.2;color:var(--ink)}
.sc-class{font-size:17px;color:#5A6784;margin-top:6px}
.sc-subjects{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:12px}
.sc-subject-pill{background:var(--line-soft);color:var(--ink);font-size:13px;font-weight:600;padding:5px 12px;border-radius:999px}
.sc-status{display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:9px 16px;border-radius:999px;font-size:15px;font-weight:600}
.sc-yes{background:var(--success-bg);color:var(--success)}
.sc-no{background:var(--line-soft);color:#5A6784}
.sc-dot{width:9px;height:9px;border-radius:50%;background:currentColor;flex-shrink:0}
.sc-qr{margin:22px auto 4px;width:250px;max-width:100%;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px}
.sc-qr svg{display:block;width:100%;height:auto}
.sc-hint{font-size:14px;color:#5A6784;line-height:1.6;margin:12px 4px 0}
.a2hs-banner{display:none;gap:12px;align-items:flex-start;background:#FFF8E1;border:2px solid #F0C929;border-radius:16px;padding:16px;margin:16px auto 0}
.a2hs-icon{font-size:28px;flex-shrink:0}
.a2hs-text strong{display:block;font-size:16px;margin-bottom:4px;color:var(--ink)}
.a2hs-text p{margin:0;font-size:14px;line-height:1.7;color:#5A6784}
.a2hs-text button{margin-top:10px;width:auto;padding:10px 18px;font-size:15px;display:none}
</style>
<div dir="rtl" class="sc">
  <div class="sc-card">
    <div class="sc-band"><span class="sc-overline">بطاقة حضور الطالب</span><span class="sc-brand">هارف</span></div>
    <div class="sc-body">
      ${subjectPills("ar", student.subjects)}
      <div class="sc-name">${escapeHtml(student.name)}</div>
      ${student.class ? `<div class="sc-class">${escapeHtml(student.class)}</div>` : ""}
      ${status}
      <div class="sc-qr">${qrSvg(scanUrl)}</div>
      <p class="sc-hint">اعرض الكود ده لموظف الاستقبال عند دخولك، وهيتسجّل حضورك على طول.</p>
    </div>
  </div>
  ${bookings.length ? `<div class="sc-card" style="margin-top:16px;padding:18px 16px;text-align:right">
    <h2 style="font-size:17px;margin:0 0 12px">استمارتك</h2>
    ${bookingTableHtml("ar", bookings)}
  </div>` : ""}
  <div class="a2hs-banner" id="a2hsBanner">
    <div class="a2hs-icon">📲</div>
    <div class="a2hs-text">
      <strong>احفظ الصفحة دي على شاشتك!</strong>
      <p id="a2hsBody">من غيرها هتضطر تدور على الرابط في واتساب كل يوم.</p>
      <button id="a2hsBtn" type="button">📲 ثبّت الصفحة دلوقتي</button>
    </div>
  </div>
</div>
<script>
(function(){
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) return;
  var banner = document.getElementById('a2hsBanner');
  var body = document.getElementById('a2hsBody');
  var btn = document.getElementById('a2hsBtn');
  var ua = navigator.userAgent;
  var isIOS = /iPhone|iPad|iPod/.test(ua);
  var isAndroid = /Android/.test(ua);
  if (isIOS) {
    body.innerHTML = 'دوس على زر المشاركة <strong>⬆️</strong> تحت في المتصفح، بعدين اختار <strong>"إضافة إلى الشاشة الرئيسية"</strong>.';
    banner.style.display = 'flex';
  } else if (isAndroid) {
    banner.style.display = 'flex';
    window.addEventListener('beforeinstallprompt', function(e){
      e.preventDefault();
      btn.style.display = 'inline-block';
      btn.onclick = function(){ e.prompt(); };
    });
  }
})();
</script>`;
      return new Response(page("بطاقة الحضور", body, { nav: false }), { headers: { "content-type": "text/html;charset=utf-8" } });
    }

    if (url.pathname === "/manifest.json" && (request.method === "GET" || request.method === "HEAD")) {
      return Response.json({
        name: "هارف · تسجيل الحضور",
        short_name: "هارف",
        theme_color: "#D42027",
        background_color: "#FAFAF8",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/icon.png", sizes: "any", type: "image/png", purpose: "any" }]
      }, { headers: { "cache-control": "public, max-age=86400" } });
    }

    if (url.pathname === "/icon.png" && (request.method === "GET" || request.method === "HEAD")) {
      const bin = atob(LOGO_B64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Response(bytes, { headers: { "content-type": "image/png", "cache-control": "public, max-age=31536000, immutable" } });
    }

    return new Response("Not found", { status: 404 });
  }
};
