import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { html, raw, getStudentBalance } from "../src/index.js";

// Cloudflare Access injects both these headers at the edge before /admin*
// requests reach the Worker in production; SELF.fetch in tests bypasses Access
// entirely, so admin calls need them added manually to simulate an
// authenticated session. The email defaults to a fixed test address, explicitly
// seeded as 'owner' on every call — relying on getStaffRole()'s empty-table
// bootstrap rule instead would only work for tests that happen to run before
// any other test seeds a non-owner `staff` row in this same shared-state file
// (a real bug this surfaced: later owner-gated tests silently started getting
// 403s once earlier tests seeded a 'clerk' row). Tests that care about a
// *specific* non-owner role should use clerkFetch() below instead.
function adminFetch(path: string, init?: RequestInit) {
  return env.DB.prepare("INSERT OR IGNORE INTO staff (email, role) VALUES ('staff@test.local', 'owner')").run().then(() =>
    SELF.fetch(path, {
      ...init,
      headers: {
        "Cf-Access-Authenticated-User-Email": "staff@test.local",
        ...(init?.headers || {}),
        "Cf-Access-Jwt-Assertion": "test"
      }
    })
  );
}

// Distinct email from adminFetch's — INSERT OR IGNORE means a shared email
// would silently keep whichever role got seeded first across the whole file.
function clerkFetch(path: string, init?: RequestInit) {
  return env.DB.prepare("INSERT OR IGNORE INTO staff (email, role) VALUES ('clerk@test.local', 'clerk')").run().then(() =>
    SELF.fetch(path, {
      ...init,
      headers: {
        "Cf-Access-Authenticated-User-Email": "clerk@test.local",
        ...(init?.headers || {}),
        "Cf-Access-Jwt-Assertion": "test"
      }
    })
  );
}

async function insertStudent(fields: Record<string, string | null>) {
  const cols = Object.keys(fields);
  const placeholders = cols.map(() => "?").join(",");
  const { meta } = await env.DB.prepare(
    `INSERT INTO students (${cols.join(",")}) VALUES (${placeholders})`
  ).bind(...cols.map((c) => fields[c])).run();
  return meta.last_row_id as number;
}

describe("subjects: stored-XSS regression (found by claude-review on PR #3, fixed 2026-07-10)", () => {
  it("escapes a malicious subjects value on the admin roster instead of rendering it raw", async () => {
    await insertStudent({
      name: "XSS Regression Test",
      status: "pending",
      subjects: "<script>alert(1)</script>,math",
    });
    const res = await adminFetch("https://example.com/admin");
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious subjects value on the public /student card", async () => {
    const id = await insertStudent({
      name: "XSS Regression Test 2",
      status: "approved",
      subjects: "<script>alert(1)</script>,math",
    });
    const res = await SELF.fetch(`https://example.com/student?id=${id}`);
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("/register: subjects whitelist", () => {
  it("drops a subjects value that isn't a known slug instead of storing it raw", async () => {
    const form = new FormData();
    form.set("name", "Whitelist Test");
    form.set("school", "Test School");
    form.set("stage", "أولى ثانوي");
    form.set("phone", "01000000000");
    form.set("subjects", "<img src=x onerror=alert(1)>");
    form.set("subjects", "math");
    form.append("subjects", "<img src=x onerror=alert(1)>");
    form.append("subjects", "math");
    form.set("parent_phone", "01111111111");

    const res = await SELF.fetch("https://example.com/register", { method: "POST", body: form });
    expect(res.status).toBe(200);

    const row = await env.DB.prepare("SELECT subjects FROM students WHERE name = 'Whitelist Test'").first();
    expect(row?.subjects).toBe("math");
  });
});

describe("/scan: attendance dedup (migration 0001_attendance_dedup.sql)", () => {
  it("scanning the same student twice in one day records only one attendance row", async () => {
    const id = await insertStudent({ name: "Dedup Test", status: "approved" });

    const first = await SELF.fetch(`https://example.com/scan?student=${id}`);
    const second = await SELF.fetch(`https://example.com/scan?student=${id}`);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(1);
  });

  it("scanning on a new day after already attending yesterday records a second row", async () => {
    const id = await insertStudent({ name: "Cross-Day Dedup Test", status: "approved" });
    await env.DB.prepare(
      "INSERT INTO attendance (student_id, scanned_at) VALUES (?, datetime('now', '-1 day'))"
    ).bind(id).run();

    const res = await SELF.fetch(`https://example.com/scan?student=${id}`);
    expect(res.status).toBe(200);

    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(2);
  });
});

describe("/scan: approval gating (payment-gate business logic)", () => {
  it("rejects a pending (unapproved) student and records no attendance", async () => {
    const id = await insertStudent({ name: "Pending Test", status: "pending" });

    const res = await SELF.fetch(`https://example.com/scan?student=${id}`);
    expect(res.status).toBe(403);

    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(0);
  });
});

describe("/scan: group validation (claude-review, PR #8 — unauthenticated /scan could attribute attendance, and therefore per_session teacher payouts, to an arbitrary/fake group id)", () => {
  it("rejects a scan against a nonexistent group id and records no attendance", async () => {
    const id = await insertStudent({ name: "Bad Group Test", status: "approved" });
    const res = await SELF.fetch(`https://example.com/scan?student=${id}&group=999999`);
    expect(res.status).toBe(403);
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(0);
  });

  it("rejects a scan against a deactivated group id and records no attendance", async () => {
    const id = await insertStudent({ name: "Inactive Group Test", status: "approved" });
    const { meta } = await env.DB.prepare("INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. غير نشط', 'math', 0)").run();
    const res = await SELF.fetch(`https://example.com/scan?student=${id}&group=${meta.last_row_id}`);
    expect(res.status).toBe(403);
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(0);
  });

  it("accepts a scan against a real, active group id", async () => {
    const id = await insertStudent({ name: "Good Group Test", status: "approved" });
    const { meta } = await env.DB.prepare("INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. نشط', 'math', 1)").run();
    const res = await SELF.fetch(`https://example.com/scan?student=${id}&group=${meta.last_row_id}`);
    expect(res.status).toBe(200);
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ? AND group_id = ?").bind(id, meta.last_row_id).first();
    expect(count?.n).toBe(1);
  });
});

describe("/student: unknown id", () => {
  it("returns a branded 404 instead of a crash for a nonexistent student id", async () => {
    const res = await SELF.fetch("https://example.com/student?id=999999");
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain("لم يتم العثور على الطالب");
  });
});

describe("/admin/students/:id/process: booking rows (estamara table)", () => {
  async function processForm(id: number, extra: Record<string, string>) {
    const form = new FormData();
    form.set("name", "Booking Test");
    form.set("school", "Test School");
    form.set("stage", "أولى ثانوي");
    form.set("phone", "01000000001");
    form.set("parent_phone", "01111111112");
    form.set("payment_method", "cash");
    for (const [k, v] of Object.entries(extra)) form.append(k, v);
    return adminFetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });
  }

  it("inserts one booking row per subject with teacher/schedule/amount", async () => {
    const id = await insertStudent({ name: "Booking Test", status: "pending", subjects: "math" });
    const res = await processForm(id, {
      b_subject: "math", b_teacher: "أ. أحمد", b_schedule: "السبت 5PM", b_amount: "300"
    });
    expect(res.status).toBe(200); // SELF.fetch follows the 303 redirect to the success page

    const { results } = await env.DB.prepare("SELECT * FROM bookings WHERE student_id = ?").bind(id).all();
    expect(results.length).toBe(1);
    expect(results[0].teacher_name).toBe("أ. أحمد");
    expect(results[0].amount).toBe(300);
  });

  it("re-processing replaces the old booking rows instead of appending to them", async () => {
    const id = await insertStudent({ name: "Reprocess Test", status: "pending", subjects: "math" });
    await processForm(id, { b_subject: "math", b_teacher: "أ. أحمد", b_schedule: "", b_amount: "300" });
    await processForm(id, { b_subject: "physics", b_teacher: "أ. سمير", b_schedule: "", b_amount: "250" });

    const { results } = await env.DB.prepare("SELECT * FROM bookings WHERE student_id = ?").bind(id).all();
    expect(results.length).toBe(1);
    expect(results[0].subject).toBe("physics");
  });

  it("drops a booking row whose subject isn't a known slug", async () => {
    const id = await insertStudent({ name: "Bad Subject Test", status: "pending" });
    await processForm(id, { b_subject: "<script>alert(1)</script>", b_teacher: "x", b_schedule: "", b_amount: "100" });

    const { results } = await env.DB.prepare("SELECT * FROM bookings WHERE student_id = ?").bind(id).all();
    expect(results.length).toBe(0);
  });
});

describe("/admin/estamarat: management list", () => {
  it("shows the summed booking total for a processed student", async () => {
    const id = await insertStudent({ name: "Estamarat Total Test", status: "approved" });
    await env.DB.prepare("INSERT INTO bookings (student_id, subject, teacher_name, schedule, amount) VALUES (?, 'math', 'أ. أحمد', '', 300)").bind(id).run();
    await env.DB.prepare("INSERT INTO bookings (student_id, subject, teacher_name, schedule, amount) VALUES (?, 'physics', 'أ. سمير', '', 250)").bind(id).run();

    const res = await adminFetch("https://example.com/admin/estamarat");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("550.00");
  });
});

describe("student name: stored-XSS regression (found by claude-review on PR #5, fixed 2026-07-11)", () => {
  it("escapes a malicious name in the /admin/estamarat list", async () => {
    await insertStudent({
      name: "<script>alert(1)</script>",
      status: "approved",
    });
    const res = await adminFetch("https://example.com/admin/estamarat");
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name in the /admin/students/:id/estamara page title", async () => {
    const id = await insertStudent({
      name: "<script>alert(1)</script>",
      status: "approved",
    });
    const res = await adminFetch(`https://example.com/admin/students/${id}/estamara`);
    const html = await res.text();
    expect(html).not.toContain("<title><script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name in the /admin approved-student roster card (found by claude-review, round 2)", async () => {
    await insertStudent({
      name: "<script>alert(1)</script>",
      status: "approved",
    });
    const res = await adminFetch("https://example.com/admin");
    const html = await res.text();
    expect(html).not.toContain("<strong><script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name in the /admin/today attendance list (found by claude-review, round 2)", async () => {
    const id = await insertStudent({
      name: "<script>alert(1)</script>",
      status: "approved",
    });
    await env.DB.prepare("INSERT INTO attendance (student_id) VALUES (?)").bind(id).run();
    const res = await adminFetch("https://example.com/admin/today");
    const html = await res.text();
    expect(html).not.toContain("<strong><script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name in the /admin pending-card list (found by claude-review, round 3)", async () => {
    await insertStudent({
      name: "<script>alert(1)</script>",
      status: "pending",
      school: "<img src=x onerror=alert(2)>",
    });
    const res = await adminFetch("https://example.com/admin");
    const html = await res.text();
    expect(html).not.toContain("<strong><script>alert(1)</script>");
    expect(html).not.toContain("<img src=x onerror=alert(2)>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name on the success/handoff page (found by claude-review, round 3)", async () => {
    const id = await insertStudent({ name: "<script>alert(1)</script>", status: "approved" });
    const res = await adminFetch(`https://example.com/admin/students/${id}/success`);
    const html = await res.text();
    expect(html).not.toContain("<strong><script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name on /scan's confirmation page (found by claude-review, round 3)", async () => {
    const id = await insertStudent({ name: "<script>alert(1)</script>", status: "approved" });
    const res = await SELF.fetch(`https://example.com/scan?student=${id}`);
    const html = await res.text();
    expect(html).not.toContain("<strong><script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name on the public /student card (found by claude-review, round 3)", async () => {
    const id = await insertStudent({ name: "<script>alert(1)</script>", status: "approved" });
    const res = await SELF.fetch(`https://example.com/student?id=${id}`);
    const html = await res.text();
    expect(html).not.toContain('sc-name">' + "<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name on the printable /admin/print roster (found by claude-review, round 3)", async () => {
    await insertStudent({ name: "<script>alert(1)</script>", status: "approved" });
    const res = await adminFetch("https://example.com/admin/print");
    const html = await res.text();
    expect(html).not.toContain("<td><script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("/admin/students/:id/process: booking-row array length mismatch (found by claude-review, round 3)", () => {
  it("doesn't throw when b_teacher/b_schedule arrays are shorter than b_subject", async () => {
    const id = await insertStudent({ name: "Mismatch Test", status: "pending" });
    const form = new FormData();
    form.set("name", "Mismatch Test");
    form.set("phone", "01000000004");
    form.set("parent_phone", "01111111115");
    form.set("payment_method", "cash");
    form.append("b_subject", "math");
    form.append("b_subject", "physics");
    form.append("b_teacher", "أ. أحمد");
    // b_schedule and b_amount omitted entirely for the 2nd row on purpose
    form.append("b_schedule", "السبت");

    const res = await adminFetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });
    expect(res.status).toBe(200);

    const { results } = await env.DB.prepare("SELECT * FROM bookings WHERE student_id = ? ORDER BY id").bind(id).all();
    expect(results.length).toBe(2);
    expect(results[1].teacher_name).toBe("");
    expect(results[1].amount).toBe(0);
  });
});

describe("stage: whitelist at write time (found by claude-review, round 4)", () => {
  it("/register rejects a stage value that isn't a known STAGES slug", async () => {
    const form = new FormData();
    form.set("name", "Stage Whitelist Test");
    form.set("stage", "<script>alert(1)</script>");
    form.set("phone", "01000000005");
    form.set("parent_phone", "01111111116");

    const res = await SELF.fetch("https://example.com/register", { method: "POST", body: form });
    expect(res.status).toBe(400);

    const row = await env.DB.prepare("SELECT id FROM students WHERE name = 'Stage Whitelist Test'").first();
    expect(row).toBeNull();
  });

  it("/admin/students/:id/process drops an unknown stage value instead of storing it raw", async () => {
    const id = await insertStudent({ name: "Process Stage Test", status: "pending" });
    const form = new FormData();
    form.set("name", "Process Stage Test");
    form.set("stage", "<script>alert(1)</script>");
    form.set("phone", "01000000006");
    form.set("parent_phone", "01111111117");
    form.set("payment_method", "cash");
    await adminFetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT stage FROM students WHERE id = ?").bind(id).first();
    expect(row?.stage).toBe("");
  });

  it("escapes stage on the /admin/estamarat list even for a legacy row bypassing the whitelist", async () => {
    await insertStudent({
      name: "Legacy Stage Test",
      status: "approved",
      stage: "<script>alert(1)</script>",
    });
    const res = await adminFetch("https://example.com/admin/estamarat");
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes class on the /admin approved-student roster even for a legacy row bypassing the whitelist", async () => {
    await insertStudent({
      name: "Legacy Class Test",
      status: "approved",
      class: "<script>alert(1)</script>",
    });
    const res = await adminFetch("https://example.com/admin");
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("attribute-breakout XSS: process-page pre-filled form fields (found in a self-audit after round 4)", () => {
  it("escapes a name containing a double-quote instead of letting it break out of value=\"...\"", async () => {
    const id = await insertStudent({
      name: 'Breakout"><script>alert(1)</script>',
      status: "pending",
    });
    const res = await adminFetch(`https://example.com/admin/students/${id}/process`);
    const html = await res.text();
    expect(html).not.toContain('"><script>alert(1)</script>');
    expect(html).toContain("&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("/admin/students/:id/process: booking amount can't go negative", () => {
  it("clamps a negative fee to 0 instead of storing it raw", async () => {
    const id = await insertStudent({ name: "Negative Amount Test", status: "pending" });
    const form = new FormData();
    form.set("name", "Negative Amount Test");
    form.set("phone", "01000000003");
    form.set("parent_phone", "01111111114");
    form.set("payment_method", "cash");
    form.set("b_subject", "math");
    form.set("b_teacher", "x");
    form.set("b_schedule", "x");
    form.set("b_amount", "-500");
    await adminFetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT amount FROM bookings WHERE student_id = ?").bind(id).first();
    expect(row?.amount).toBe(0);
  });
});

describe("/ no longer serves the dashboard unauthenticated (found post-deploy 2026-07-11)", () => {
  it("redirects / to the gated /admin/intake instead of rendering revenue at the open root", async () => {
    const id = await insertStudent({ name: "Dashboard Redirect Test", status: "approved" });
    await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, teacher_name, schedule, amount) VALUES (?, 'math', 'x', '', 12345)"
    ).bind(id).run();

    const res = await SELF.fetch("https://example.com/", { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/admin/intake");

    const html = await res.text();
    expect(html).not.toContain("12345");
  });
});

// 2026-07-13: /admin/dashboard retired in favor of the /council-verdict
// role-first/time-first split (/admin/intake, /admin/session, /admin/owner) —
// kept as a bare redirect for old bookmarks/muscle memory.
describe("/admin/students/:id/process: track whitelist", () => {
  it("drops an invalid track value instead of storing it raw", async () => {
    const id = await insertStudent({ name: "Track Test", status: "pending" });
    const form = new FormData();
    form.set("name", "Track Test");
    form.set("phone", "01000000002");
    form.set("parent_phone", "01111111113");
    form.set("payment_method", "cash");
    form.set("track", "<script>alert(1)</script>");
    await adminFetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT track FROM students WHERE id = ?").bind(id).first();
    expect(row?.track).toBe("");
  });
});

describe("/admin*: in-app Access defense-in-depth (added 2026-07-12, follow-up to the /admin dashboard leak)", () => {
  it("rejects an /admin request with no Cf-Access-Jwt-Assertion header even though Cloudflare Access is the primary gate", async () => {
    const res = await SELF.fetch("https://example.com/admin/dashboard");
    expect(res.status).toBe(403);
  });

  it("allows the same request through once the header is present", async () => {
    const res = await adminFetch("https://example.com/admin/dashboard");
    expect(res.status).toBe(200);
  });
});

describe("/admin/dashboard: owner-only server-side gate (found by manual review 2026-07-14, forbiddenRole() was dead code)", () => {
  it("rejects a clerk-role staff member with 403, not just hiding the nav link", async () => {
    const res = await clerkFetch("https://example.com/admin/dashboard");
    expect(res.status).toBe(403);
  });

  it("still allows an owner through", async () => {
    const res = await adminFetch("https://example.com/admin/dashboard");
    expect(res.status).toBe(200);
  });
});

describe("/register: subject → teacher live panel (added 2026-07-13, most students search by teacher not subject)", () => {
  it("renders a hidden block naming the teacher for a subject that has one", async () => {
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, phase, mode, schedule, track) VALUES ('t1', 'أ. أحمد', 'math', NULL, 'سنتر', 'السبت 5PM', NULL)"
    ).run();

    const res = await SELF.fetch("https://example.com/register");
    const html = await res.text();
    expect(html).toContain('data-subject-block="math"');
    expect(html).toContain("أ. أحمد");
  });

  it("keeps a dual-track subject's Arabic and English-cousin teacher lists separate", async () => {
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, phase, mode, schedule, track) VALUES ('t2', 'Mr. Sam', 'math', NULL, 'اونلاين', '', 'لغات')"
    ).run();
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, phase, mode, schedule, track) VALUES ('t3', 'أ. محمود', 'math', NULL, 'سنتر', '', 'عربي')"
    ).run();

    const res = await SELF.fetch("https://example.com/register");
    const html = await res.text();
    // Slice from this block's own marker up to whichever comes first — the next
    // block's marker or the end of the subjects panel — rather than counting
    // "</div>" tags, since teacherCard() nests its own <div>s inside each block.
    function blockFor(slug: string) {
      const marker = `data-subject-block="${slug}"`;
      const start = html.indexOf(marker);
      const next = html.indexOf('data-subject-block="', start + marker.length);
      return html.slice(start, next === -1 ? html.indexOf("</form>", start) : next);
    }
    expect(blockFor("math")).not.toContain("Mr. Sam");
    expect(blockFor("math-en")).not.toContain("أ. محمود");
  });
});

describe("/register: teacher picker (added 2026-07-13, students can now select a teacher, not just view them)", () => {
  it("renders a selectable radio per teacher with the pick_<slug> name and a data-teacher-schedule attribute", async () => {
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, phase, mode, schedule, track, photo) VALUES ('t-pick-1', 'أ. جمال', 'math', NULL, 'سنتر', 'الجمعة 4PM', NULL, '/designs/teachers/gamal.jpg')"
    ).run();

    const res = await SELF.fetch("https://example.com/register");
    const html = await res.text();
    expect(html).toContain('name="pick_math"');
    expect(html).toContain('value="t-pick-1"');
    expect(html).toContain('data-teacher-schedule="الجمعة 4PM"');
    expect(html).toContain('src="https://harvcentereg.com/designs/teachers/gamal.jpg"');
  });

  it("renders a fallback initial avatar when a teacher has no photo", async () => {
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, phase, mode, schedule, track) VALUES ('t-pick-nophoto', 'يوسف', 'math', NULL, 'سنتر', '', NULL)"
    ).run();
    const res = await SELF.fetch("https://example.com/register");
    const html = await res.text();
    expect(html).toContain('t-photo--empty');
  });

  it("escapes a teacher photo path instead of letting it break out of the src attribute (found by claude-review, PR #8)", async () => {
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, phase, mode, schedule, track, photo) VALUES ('t-pick-xss', 'أ. خطر', 'math', NULL, 'سنتر', '', NULL, '\" onerror=\"alert(1)')"
    ).run();
    const res = await SELF.fetch("https://example.com/register");
    const html = await res.text();
    expect(html).not.toContain('onerror="alert(1)"');
    expect(html).toContain("&quot; onerror=&quot;alert(1)");
  });

  it("seeds a booking row (amount 0) from a pick_<slug> selection on submit", async () => {
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, phase, mode, schedule, track) VALUES ('t-pick-2', 'أ. سامي', 'physics', NULL, 'سنتر', 'الأحد 6PM', NULL)"
    ).run();
    const form = new FormData();
    form.set("name", "Picker Test Student");
    form.set("stage", "تالتة ثانوي");
    form.set("phone", "01111111111");
    form.set("parent_phone", "01222222222");
    form.set("subjects", "physics");
    form.set("pick_physics", "t-pick-2");
    const res = await SELF.fetch("https://example.com/register", { method: "POST", body: form });
    expect(res.status).toBe(200);

    const { results: students } = await env.DB.prepare("SELECT id FROM students WHERE name = ?").bind("Picker Test Student").all();
    const studentId = (students[0] as any).id;
    const { results: bookings } = await env.DB.prepare("SELECT subject, teacher_name, schedule, amount FROM bookings WHERE student_id = ?").bind(studentId).all();
    expect(bookings).toEqual([{ subject: "physics", teacher_name: "أ. سامي", schedule: "الأحد 6PM", amount: 0 }]);
  });

  it("does not insert a booking when no teacher was picked for a subject", async () => {
    const form = new FormData();
    form.set("name", "No Pick Test Student");
    form.set("stage", "تالتة ثانوي");
    form.set("phone", "01133331111");
    form.set("parent_phone", "01244442222");
    form.set("subjects", "physics");
    const res = await SELF.fetch("https://example.com/register", { method: "POST", body: form });
    expect(res.status).toBe(200);

    const { results: students } = await env.DB.prepare("SELECT id FROM students WHERE name = ?").bind("No Pick Test Student").all();
    const studentId = (students[0] as any).id;
    const { results: bookings } = await env.DB.prepare("SELECT * FROM bookings WHERE student_id = ?").bind(studentId).all();
    expect(bookings).toEqual([]);
  });
});

describe("/admin/students/:id/process: teacher ref panel pre-selects and fills bookings (added 2026-07-13)", () => {
  it("pre-checks the radio matching an existing booking's teacher for that subject", async () => {
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, phase, mode, schedule, track) VALUES ('t-ref-1', 'أ. هيثم', 'math', NULL, 'سنتر', 'السبت 3PM', NULL)"
    ).run();
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, phase, mode, schedule, track) VALUES ('t-ref-2', 'أ. وليد', 'math', NULL, 'سنتر', 'الأحد 3PM', NULL)"
    ).run();
    const id = await insertStudent({ name: "Ref Panel Pick Test", status: "pending", subjects: "math" });
    await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, teacher_name, schedule, amount) VALUES (?, 'math', 'أ. وليد', 'الأحد 3PM', 0)"
    ).bind(id).run();

    const res = await adminFetch(`https://example.com/admin/students/${id}/process`);
    const html = await res.text();
    const waliedMarker = `value="t-ref-2" checked`;
    const haithamMarker = `value="t-ref-1" checked`;
    expect(html).toContain(waliedMarker);
    expect(html).not.toContain(haithamMarker);
  });
});

describe("html`` tagged template (added 2026-07-12, for future render functions)", () => {
  it("escapes an interpolated value by default", () => {
    const out = html`<strong>${"<script>alert(1)</script>"}</strong>`;
    expect(out).toBe("<strong>&lt;script&gt;alert(1)&lt;/script&gt;</strong>");
  });

  it("leaves raw()-wrapped HTML untouched instead of double-escaping it", () => {
    const inner = html`<em>${"safe"}</em>`;
    const out = html`<div>${raw(inner)}</div>`;
    expect(out).toBe("<div><em>safe</em></div>");
  });

  it("escapes every item in an interpolated array and joins them", () => {
    const out = html`<ul>${["<b>a</b>", "b"]}</ul>`;
    expect(out).toBe("<ul>&lt;b&gt;a&lt;/b&gt;b</ul>");
  });
});

describe("roster: one-tap WhatsApp send per row (added 2026-07-14)", () => {
  it("renders a WhatsApp link linking to the student's own /student page, for an approved student with a phone", async () => {
    const id = await insertStudent({ name: "WA Roster Test", status: "approved", phone: "01000000077" });
    const html = await (await adminFetch("https://example.com/admin")).text();
    expect(html).toContain("wa.me/201000000077");
    expect(html).toContain(encodeURIComponent(`student?id=${id}`));
  });

  it("omits the WhatsApp button for an approved student with no phone on file", async () => {
    await insertStudent({ name: "No Phone Roster Test", status: "approved", phone: null });
    const html = await (await adminFetch("https://example.com/admin")).text();
    // Can't assert global absence of "wa.me" since other students in this
    // shared-state file may have phones — check this specific card has no link.
    const cardStart = html.indexOf("No Phone Roster Test");
    const cardEnd = html.indexOf("</div></div>", cardStart);
    const card = html.slice(cardStart, cardEnd);
    expect(card).not.toContain("wa.me");
  });
});

describe("getStudentBalance (claude-review, PR #8 finding #2 — money-facing function with no direct test)", () => {
  it("balance = active bookings' fees minus discounts minus payments", async () => {
    const id = await insertStudent({ name: "Balance Unit Test", status: "approved" });
    await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, amount, discount_amount, status) VALUES (?, 'math', 300, 50, 'active')"
    ).bind(id).run();
    await env.DB.prepare("INSERT INTO payments (student_id, amount) VALUES (?, 75)").bind(id).run();

    const { owed, paid, balance } = await getStudentBalance(env, id);
    expect(owed).toBe(250); // 300 - 50 discount
    expect(paid).toBe(75);
    expect(balance).toBe(175); // 250 - 75
  });

  it("a dropped (non-active) booking doesn't count toward owed", async () => {
    const id = await insertStudent({ name: "Balance Dropped Test", status: "approved" });
    await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, amount, status) VALUES (?, 'math', 300, 'dropped')"
    ).bind(id).run();

    const { owed, balance } = await getStudentBalance(env, id);
    expect(owed).toBe(0);
    expect(balance).toBe(0);
  });
});

describe("/admin/students/:id/process: booking group_id validated against real, active groups (claude-review, PR #8 finding #5)", () => {
  function processForm(overrides = {}) {
    const form = new FormData();
    form.set("name", "Group Validation Test");
    form.set("stage", "أولى ثانوي");
    form.set("phone", "01000000088");
    form.set("parent_phone", "01111111199");
    form.set("b_subject", "math");
    form.set("b_teacher", "أ. تجربة");
    form.set("b_schedule", "");
    form.set("b_amount", "200");
    for (const [k, v] of Object.entries(overrides)) form.set(k, v as string);
    return form;
  }

  it("drops a nonexistent group id instead of attaching an orphaned reference", async () => {
    const id = await insertStudent({ name: "Group Validation Test", status: "pending" });
    await adminFetch(`https://example.com/admin/students/${id}/process`, {
      method: "POST", body: processForm({ b_group: "999999" })
    });
    const row = await env.DB.prepare("SELECT group_id FROM bookings WHERE student_id = ?").bind(id).first();
    expect(row?.group_id).toBeFalsy();
  });

  it("drops a deactivated group id the same way", async () => {
    const id = await insertStudent({ name: "Group Validation Test", status: "pending" });
    const { meta } = await env.DB.prepare("INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. تجربة', 'math', 0)").run();
    await adminFetch(`https://example.com/admin/students/${id}/process`, {
      method: "POST", body: processForm({ b_group: String(meta.last_row_id) })
    });
    const row = await env.DB.prepare("SELECT group_id FROM bookings WHERE student_id = ?").bind(id).first();
    expect(row?.group_id).toBeFalsy();
  });

  it("attaches a real, active group id", async () => {
    const id = await insertStudent({ name: "Group Validation Test", status: "pending" });
    const { meta } = await env.DB.prepare("INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. تجربة', 'math', 1)").run();
    await adminFetch(`https://example.com/admin/students/${id}/process`, {
      method: "POST", body: processForm({ b_group: String(meta.last_row_id) })
    });
    const row = await env.DB.prepare("SELECT group_id FROM bookings WHERE student_id = ?").bind(id).first();
    expect(row?.group_id).toBe(meta.last_row_id);
  });
});

