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

// /admin/scan-mark is POST-only (claude-review, PR #10 finding #2 — a
// mutating GET was CSRF-able), so tests post a form-encoded body instead of
// a query string.
function scanMarkFetch(student: number | string, group?: number | string) {
  const body = new URLSearchParams({ student: String(student) });
  if (group !== undefined) body.set("group", String(group));
  return adminFetch("https://example.com/admin/scan-mark", {
    method: "POST",
    body: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
}

// clerkFetch() is defined further down this file (used by the rooms/groups/
// bookings work) — reused here instead of a second near-identical definition.

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

describe("/register: photo content-type whitelist (claude-review, PR #10 finding #1)", () => {
  it("normalizes a spoofed photo content-type to image/jpeg instead of trusting it verbatim", async () => {
    const form = new FormData();
    form.set("name", "Photo Type Spoof Test");
    form.set("school", "Test School");
    form.set("stage", "أولى ثانوي");
    form.set("phone", "01000000009");
    form.set("parent_phone", "01111111119");
    // A real attack would set type to text/html to get stored bytes served
    // back with an attacker-chosen content-type at /admin/students/:id/photo.
    form.set("photo", new File([new Uint8Array([1, 2, 3])], "x.html", { type: "text/html" }));

    await SELF.fetch("https://example.com/register", { method: "POST", body: form });
    const row = await env.DB.prepare("SELECT photo_type FROM students WHERE name = 'Photo Type Spoof Test'").first();
    expect(row?.photo_type).toBe("image/jpeg");
  });

  it("keeps a real allowed content-type as-is", async () => {
    const form = new FormData();
    form.set("name", "Photo Type Real Test");
    form.set("school", "Test School");
    form.set("stage", "أولى ثانوي");
    form.set("phone", "01000000010");
    form.set("parent_phone", "01111111120");
    form.set("photo", new File([new Uint8Array([1, 2, 3])], "x.png", { type: "image/png" }));

    await SELF.fetch("https://example.com/register", { method: "POST", body: form });
    const row = await env.DB.prepare("SELECT photo_type FROM students WHERE name = 'Photo Type Real Test'").first();
    expect(row?.photo_type).toBe("image/png");
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

describe("/admin/scan-mark: JSON endpoint backing the /admin/counter hardware-scanner page (added 2026-07-13)", () => {
  it("rejects with no Cf-Access-Jwt-Assertion header, same as any other /admin* route", async () => {
    const res = await SELF.fetch("https://example.com/admin/scan-mark", {
      method: "POST", body: "student=1", headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    expect(res.status).toBe(403);
  });

  it("no longer accepts GET — a mutating GET was CSRF-able (claude-review, PR #10 finding #2)", async () => {
    const res = await adminFetch("https://example.com/admin/scan-mark?student=1");
    expect(res.status).toBe(404);
  });

  it("returns not_found for an unknown id", async () => {
    const res = await scanMarkFetch(999999);
    expect(await res.json()).toEqual({ result: "not_found" });
  });

  it("returns pending for an unapproved student and records no attendance", async () => {
    const id = await insertStudent({ name: "Counter Pending Test", status: "pending" });
    const res = await scanMarkFetch(id);
    expect(await res.json()).toEqual({ result: "pending", name: "Counter Pending Test" });
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(0);
  });

  it("marks attendance on first scan, then reports already on a second scan same day (and includes a live running count, added 2026-07-14)", async () => {
    const id = await insertStudent({ name: "Counter Marked Test", status: "approved" });
    const first = await scanMarkFetch(id);
    // count is the global (ungrouped) today-total, which earlier tests in this
    // shared-state file also contribute to — check it's a real number, not an
    // exact value tied to file-execution order.
    expect(await first.json()).toEqual({ result: "marked", name: "Counter Marked Test", stage: "", photoUrl: null, count: expect.any(Number) });
    const second = await scanMarkFetch(id);
    expect(await second.json()).toEqual({ result: "already", name: "Counter Marked Test", stage: "", photoUrl: null, count: expect.any(Number) });
  });

  it("scopes the live count to the pinned group, isolated from other groups/ungrouped scans", async () => {
    const { meta } = await env.DB.prepare("INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. عداد', 'math', 1)").run();
    const groupId = meta.last_row_id;
    const s1 = await insertStudent({ name: "Count Scope 1", status: "approved" });
    const s2 = await insertStudent({ name: "Count Scope 2", status: "approved" });
    const r1 = await (await scanMarkFetch(s1, groupId)).json() as any;
    expect(r1.count).toBe(1);
    const r2 = await (await scanMarkFetch(s2, groupId)).json() as any;
    expect(r2.count).toBe(2);
  });

  it("rejects scanning against a deactivated group instead of recording attendance (claude-review, PR #10 finding #3)", async () => {
    const { meta } = await env.DB.prepare("INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. متوقف', 'math', 0)").run();
    const id = await insertStudent({ name: "Inactive Group Scan Test", status: "approved" });
    const res = await (await scanMarkFetch(id, meta.last_row_id)).json() as any;
    expect(res.result).toBe("invalid_group");
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(0);
  });
});

describe("scan confirmation carries richer identity + room data (added 2026-07-14)", () => {
  it("includes stage in the scan-mark response for identity confirmation", async () => {
    const id = await insertStudent({ name: "Stage Scan Test", status: "approved", stage: "تالتة ثانوي" });
    const json = await (await scanMarkFetch(id)).json() as any;
    expect(json.stage).toBe("تالتة ثانوي");
  });

  it("includes a photoUrl for a student with a stored photo, and null for one without", async () => {
    const idWithPhoto = await insertStudent({ name: "Photo Scan Test", status: "approved" });
    await env.DB.prepare("UPDATE students SET photo = ?, photo_type = 'image/jpeg' WHERE id = ?")
      .bind(new Uint8Array([1, 2, 3]).buffer, idWithPhoto).run();
    const withPhoto = await (await scanMarkFetch(idWithPhoto)).json() as any;
    expect(withPhoto.photoUrl).toBe(`/admin/students/${idWithPhoto}/photo`);

    const idNoPhoto = await insertStudent({ name: "No Photo Scan Test", status: "approved" });
    const noPhoto = await (await scanMarkFetch(idNoPhoto)).json() as any;
    expect(noPhoto.photoUrl).toBeNull();
  });

  it("serves the stored photo bytes at /admin/students/:id/photo, and 404s when there's none", async () => {
    const id = await insertStudent({ name: "Photo Bytes Test", status: "approved" });
    await env.DB.prepare("UPDATE students SET photo = ?, photo_type = 'image/png' WHERE id = ?")
      .bind(new Uint8Array([9, 9, 9]).buffer, id).run();
    const res = await adminFetch(`https://example.com/admin/students/${id}/photo`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");

    const idNoPhoto = await insertStudent({ name: "No Photo Bytes Test", status: "approved" });
    const res2 = await adminFetch(`https://example.com/admin/students/${idNoPhoto}/photo`);
    expect(res2.status).toBe(404);
  });

  it("attaches roomName from the group's assigned room on a grouped scan", async () => {
    const { meta: roomMeta } = await env.DB.prepare("INSERT INTO rooms (name) VALUES ('قاعة 1')").run();
    const { meta: groupMeta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active, room_id) VALUES ('أ. روم تيست', 'math', 1, ?)"
    ).bind(roomMeta.last_row_id).run();
    const id = await insertStudent({ name: "Room Scan Test", status: "approved" });
    const res = await (await scanMarkFetch(id, groupMeta.last_row_id)).json() as any;
    expect(res.roomName).toBe("قاعة 1");
  });

  it("names the room in the /admin/counter pinned banner", async () => {
    const { meta: roomMeta } = await env.DB.prepare("INSERT INTO rooms (name) VALUES ('قاعة 2')").run();
    const { meta: groupMeta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active, room_id) VALUES ('أ. بانر تيست', 'math', 1, ?)"
    ).bind(roomMeta.last_row_id).run();
    const html = await (await adminFetch(`https://example.com/admin/counter?group=${groupMeta.last_row_id}`)).text();
    expect(html).toContain("قاعة 2");
  });

  it("shows the room name next to a grouped student's row on /admin/today", async () => {
    const { meta: roomMeta } = await env.DB.prepare("INSERT INTO rooms (name) VALUES ('قاعة 3')").run();
    const { meta: groupMeta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active, room_id) VALUES ('أ. تودي تيست', 'math', 1, ?)"
    ).bind(roomMeta.last_row_id).run();
    const id = await insertStudent({ name: "Today Room Test", status: "approved" });
    await scanMarkFetch(id, groupMeta.last_row_id);
    const html = await (await adminFetch("https://example.com/admin/today")).text();
    const cardStart = html.indexOf("Today Room Test");
    const cardEnd = html.indexOf("</div></div>", cardStart);
    expect(html.slice(cardStart, cardEnd)).toContain("قاعة 3");
  });

  it("shows the room name in the /admin/attendance per-group header", async () => {
    const { meta: roomMeta } = await env.DB.prepare("INSERT INTO rooms (name) VALUES ('قاعة 4')").run();
    const { meta: groupMeta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active, room_id) VALUES ('أ. اتيندنس تيست', 'math', 1, ?)"
    ).bind(roomMeta.last_row_id).run();
    const html = await (await adminFetch(`https://example.com/admin/attendance?group=${groupMeta.last_row_id}`)).text();
    expect(html).toContain("قاعة 4");
  });

  it("the counter page renders a recently-scanned table for a student marked into the pinned group", async () => {
    const { meta: groupMeta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. ريسنت تيست', 'math', 1)"
    ).run();
    const id = await insertStudent({ name: "Recent Scan Test", status: "approved", stage: "أولى ثانوي" });
    await scanMarkFetch(id, groupMeta.last_row_id);
    const html = await (await adminFetch(`https://example.com/admin/counter?group=${groupMeta.last_row_id}`)).text();
    expect(html).toContain('id="counter-recent-body"');
    expect(html).toContain("Recent Scan Test");
    expect(html).toContain("أولى ثانوي");
  });

  it("isolates the recently-scanned table per group — a scan in one group doesn't show up when pinned to another", async () => {
    const { meta: groupAMeta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. ايزوليشن ا', 'math', 1)"
    ).run();
    const { meta: groupBMeta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. ايزوليشن ب', 'math', 1)"
    ).run();
    const id = await insertStudent({ name: "Isolation Scan Test", status: "approved" });
    await scanMarkFetch(id, groupAMeta.last_row_id);
    const htmlB = await (await adminFetch(`https://example.com/admin/counter?group=${groupBMeta.last_row_id}`)).text();
    expect(htmlB).not.toContain("Isolation Scan Test");
  });
});

describe("/admin/counter: hardware-scanner kiosk page (added 2026-07-13)", () => {
  it("rejects with no Cf-Access-Jwt-Assertion header", async () => {
    const res = await SELF.fetch("https://example.com/admin/counter");
    expect(res.status).toBe(403);
  });

  // 2026-07-14: a bare /admin/counter hit no longer jumps straight into scan
  // mode — it shows a group picker first, per Hazem's "make sure whoever's
  // scanning knows what's going on where." The scan UI now needs either a
  // real ?group=ID or an explicit ?general=1 opt-in.
  it("shows a group picker (not the scan input) on a bare hit with no group chosen yet", async () => {
    const res = await adminFetch("https://example.com/admin/counter");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain('id="counter-input"');
    expect(html).toContain("امسح عام من غير مجموعة"); // the explicit general-mode opt-out link
  });

  it("renders the always-focused scan input once a group is picked", async () => {
    const { meta } = await env.DB.prepare("INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. سكانر', 'math', 1)").run();
    const res = await adminFetch(`https://example.com/admin/counter?group=${meta.last_row_id}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="counter-input"');
  });

  it("renders the scan input in explicit general (unpinned) mode", async () => {
    const res = await adminFetch("https://example.com/admin/counter?general=1");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="counter-input"');
  });

  // Regression (reported by Hazem clicking through in a real browser: "the page
  // goes away"): .counter-input had no explicit width, so it inherited the
  // global input{width:100%} rule. Being position:absolute with no positioned
  // ancestor, that 100% resolved against the initial containing block and blew
  // the whole page out to ~2400px wide, pushing all visible content off-screen.
  it("gives .counter-input an explicit width instead of inheriting the global input{width:100%} rule", async () => {
    const res = await adminFetch("https://example.com/admin/counter");
    const html = await res.text();
    const rule = html.match(/\.counter-input\{[^}]*\}/)?.[0] || "";
    expect(rule).toMatch(/width:\s*1px/);
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

describe("/scan + /admin/scan-mark: per-session (group-scoped) attendance (added 2026-07-13, migration 0010_attendance_group.sql)", () => {
  async function makeGroup(teacherName: string) {
    const { meta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active) VALUES (?, 'math', 1)"
    ).bind(teacherName).run();
    return meta.last_row_id as number;
  }

  it("scanning into two different groups the same day records two rows", async () => {
    const id = await insertStudent({ name: "Two Groups Test", status: "approved" });
    const g1 = await makeGroup("أ. أول");
    const g2 = await makeGroup("أ. تاني");

    await SELF.fetch(`https://example.com/scan?student=${id}&group=${g1}`);
    await SELF.fetch(`https://example.com/scan?student=${id}&group=${g2}`);

    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(2);
  });

  it("scanning the same group twice the same day still dedupes to one row", async () => {
    const id = await insertStudent({ name: "Same Group Twice Test", status: "approved" });
    const g1 = await makeGroup("أ. تالت");

    await SELF.fetch(`https://example.com/scan?student=${id}&group=${g1}`);
    const second = await SELF.fetch(`https://example.com/scan?student=${id}&group=${g1}`);
    const secondJson = await SELF.fetch("https://example.com/admin/scan-mark", {
      method: "POST", body: `student=${id}&group=${g1}`,
      headers: { "Cf-Access-Jwt-Assertion": "test", "Content-Type": "application/x-www-form-urlencoded" }
    }).then(r => r.json()) as any;

    expect(second.status).toBe(200);
    expect(secondJson.result).toBe("already");
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ? AND group_id = ?").bind(id, g1).first();
    expect(count?.n).toBe(1);
  });

  it("snapshots the group's teacher_name onto the attendance row at scan time", async () => {
    const id = await insertStudent({ name: "Snapshot Test", status: "approved" });
    const g1 = await makeGroup("أ. سناب شوت");
    await SELF.fetch(`https://example.com/scan?student=${id}&group=${g1}`);
    const row = await env.DB.prepare("SELECT teacher_name FROM attendance WHERE student_id = ?").bind(id).first();
    expect(row?.teacher_name).toBe("أ. سناب شوت");
  });

  it("a grouped scan and a later ungrouped scan for the same student the same day are independent (regression: NULL group_id isn't covered by the unique index, guarded in code)", async () => {
    const id = await insertStudent({ name: "Mixed Scan Test", status: "approved" });
    const g1 = await makeGroup("أ. مختلط");
    await SELF.fetch(`https://example.com/scan?student=${id}&group=${g1}`);
    await SELF.fetch(`https://example.com/scan?student=${id}`);
    await SELF.fetch(`https://example.com/scan?student=${id}`); // second ungrouped scan same day — must still dedupe

    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM attendance WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(2); // one grouped + one ungrouped, not three
  });
});

describe("/admin/attendance: per-group report (added 2026-07-13)", () => {
  it("blocks unauthenticated access", async () => {
    const res = await SELF.fetch("https://example.com/admin/attendance");
    expect(res.status).toBe(403);
  });

  it("lists an enrolled student as absent when they haven't scanned in, and present after they do", async () => {
    const { meta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. ريبورت', 'math', 1)"
    ).run();
    const groupId = meta.last_row_id;
    const studentId = await insertStudent({ name: "Report Test", status: "approved" });
    await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, teacher_name, amount, group_id, status) VALUES (?, 'math', 'أ. ريبورت', 300, ?, 'active')"
    ).bind(studentId, groupId).run();

    const before = await adminFetch(`https://example.com/admin/attendance?group=${groupId}`);
    const beforeHtml = await before.text();
    expect(beforeHtml).toContain("Report Test");
    expect(beforeHtml).toContain("0/1");

    await SELF.fetch(`https://example.com/scan?student=${studentId}&group=${groupId}`);

    const after = await adminFetch(`https://example.com/admin/attendance?group=${groupId}`);
    const afterHtml = await after.text();
    expect(afterHtml).toContain("1/1");
  });
});

describe("/admin/students/:id/pay + balance (added 2026-07-13, migration 0011_payments_ledger.sql)", () => {
  it("blocks unauthenticated access", async () => {
    const id = await insertStudent({ name: "Pay Auth Test", status: "approved" });
    const res = await SELF.fetch(`https://example.com/admin/students/${id}/pay`, { method: "POST", body: new FormData() });
    expect(res.status).toBe(403);
  });

  it("recording a payment reduces the balance and posts a matching ledger income row", async () => {
    const id = await insertStudent({ name: "Pay Test", status: "approved" });
    await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, teacher_name, amount, status) VALUES (?, 'math', 'أ. دفع', 300, 'active')"
    ).bind(id).run();

    const form = new FormData();
    form.set("amount", "100");
    form.set("method", "cash");
    const res = await adminFetch(`https://example.com/admin/students/${id}/pay`, { method: "POST", body: form });
    expect(res.status).toBe(200); // follows the 303 redirect to the estamara page

    const payment = await env.DB.prepare("SELECT amount, method FROM payments WHERE student_id = ?").bind(id).first();
    expect(payment?.amount).toBe(100);
    expect(payment?.method).toBe("cash");

    const ledgerRow = await env.DB.prepare("SELECT kind, category, amount FROM ledger WHERE category = 'student_payment'").first();
    expect(ledgerRow?.kind).toBe("income");
    expect(ledgerRow?.amount).toBe(100);

    const estamaraHtml = await (await adminFetch(`https://example.com/admin/students/${id}/estamara`)).text();
    expect(estamaraHtml).toContain("200.00"); // 300 owed - 100 paid = 200 balance
  });

  it("a discounted booking reduces what's owed before payments are applied", async () => {
    const id = await insertStudent({ name: "Discount Test", status: "approved" });
    await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, teacher_name, amount, discount_amount, status) VALUES (?, 'math', 'أ. خصم', 300, 50, 'active')"
    ).bind(id).run();
    const html = await (await adminFetch(`https://example.com/admin/students/${id}/estamara`)).text();
    expect(html).toContain("250.00"); // 300 - 50 discount, no payments yet
  });

  it("rejects a zero or negative payment amount instead of recording it", async () => {
    const id = await insertStudent({ name: "Bad Payment Test", status: "approved" });
    const form = new FormData();
    form.set("amount", "-50");
    await adminFetch(`https://example.com/admin/students/${id}/pay`, { method: "POST", body: form });
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM payments WHERE student_id = ?").bind(id).first();
    expect(count?.n).toBe(0);
  });

  it("an overpayment from one student doesn't mask another student's outstanding balance — the dashboard tile clamps each student's balance at 0 before summing (regression: a naive global SUM(owed)-SUM(paid) would let one student's overpayment cancel out another's real debt)", async () => {
    const overpaid = await insertStudent({ name: "Overpaid Test", status: "approved" });
    await env.DB.prepare("INSERT INTO bookings (student_id, subject, teacher_name, amount, status) VALUES (?, 'math', 'أ. أ', 100, 'active')").bind(overpaid).run();
    await env.DB.prepare("INSERT INTO payments (student_id, amount) VALUES (?, 500)").bind(overpaid).run();

    const owing = await insertStudent({ name: "Still Owing Test", status: "approved" });
    await env.DB.prepare("INSERT INTO bookings (student_id, subject, teacher_name, amount, status) VALUES (?, 'math', 'أ. ب', 300, 'active')").bind(owing).run();

    // getStudentBalance() is the real function the app uses everywhere else
    // (estamara view, payment form) — exercising it here, not a hand-copied query.
    const overpaidBalance = await getStudentBalance(env, overpaid);
    const owingBalance = await getStudentBalance(env, owing);
    expect(overpaidBalance.balance).toBe(-400); // 100 owed - 500 paid
    expect(owingBalance.balance).toBe(300);

    const clampedSum = Math.max(overpaidBalance.balance, 0) + Math.max(owingBalance.balance, 0);
    expect(clampedSum).toBe(300); // a naive (unclamped) sum would give -100
  });
});

describe("/admin/ledger (added 2026-07-13)", () => {
  it("blocks unauthenticated access", async () => {
    expect((await SELF.fetch("https://example.com/admin/ledger")).status).toBe(403);
  });

  it("records an expense and shows it in today's totals", async () => {
    const form = new FormData();
    form.set("category", "rent");
    form.set("amount", "1000");
    form.set("note", "شهر يوليو");
    await adminFetch("https://example.com/admin/ledger/expense", { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT kind, category, amount FROM ledger WHERE category = 'rent'").first();
    expect(row?.kind).toBe("expense");
    expect(row?.amount).toBe(1000);

    const html = await (await adminFetch("https://example.com/admin/ledger")).text();
    expect(html).toContain("1000.00");
  });

  it("rejects an expense with an unknown category instead of storing it raw", async () => {
    const form = new FormData();
    form.set("category", "<script>alert(1)</script>");
    form.set("amount", "100");
    await adminFetch("https://example.com/admin/ledger/expense", { method: "POST", body: form });
    const row = await env.DB.prepare("SELECT * FROM ledger WHERE category = '<script>alert(1)</script>'").first();
    expect(row).toBeFalsy();
  });
});

describe("/admin/groups + /admin/rooms (added 2026-07-13, extracted from the retired CenterStudent app's Groupdata/roomdata tables)", () => {
  it("blocks unauthenticated access to /admin/groups and /admin/rooms", async () => {
    expect((await SELF.fetch("https://example.com/admin/groups")).status).toBe(403);
    expect((await SELF.fetch("https://example.com/admin/rooms")).status).toBe(403);
  });

  it("creates a room, then a group referencing it, and shows live enrolled/capacity", async () => {
    let form = new FormData();
    form.set("name", "قاعة 1");
    form.set("floor", "الدور الأول");
    form.set("capacity", "20");
    await adminFetch("https://example.com/admin/rooms", { method: "POST", body: form });
    const room = await env.DB.prepare("SELECT id FROM rooms WHERE name = 'قاعة 1'").first();
    expect(room).toBeTruthy();

    // Group creation picks a teacher from a real subject-filtered <select> now
    // (2026-07-13) — teacher_id, not free-text teacher_name.
    await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('t-groups-ahmed', 'أ. أحمد', 'math')").run();
    form = new FormData();
    form.set("teacher_id", "t-groups-ahmed");
    form.set("subject", "math");
    form.set("stage", "أولى ثانوي");
    form.set("day", "السبت");
    form.set("time", "5PM");
    form.set("room_id", String((room as any).id));
    form.set("capacity", "2");
    form.set("price", "300");
    await adminFetch("https://example.com/admin/groups", { method: "POST", body: form });

    const res = await adminFetch("https://example.com/admin/groups");
    const body = await res.text();
    expect(body).toContain("أ. أحمد");
    expect(body).toContain("0/2"); // no bookings attached yet

    const row = await env.DB.prepare("SELECT teacher_id, teacher_name FROM groups WHERE teacher_name = 'أ. أحمد'").first();
    expect(row?.teacher_id).toBe("t-groups-ahmed"); // real FK populated, not just the name snapshot
  });

  it("embeds the subject-to-teacher mapping in the create-group form for client-side filtering", async () => {
    await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('t-math-only', 'أ. رياضة', 'math')").run();
    await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('t-physics-only', 'أ. فيزياء', 'physics')").run();

    const html = await (await adminFetch("https://example.com/admin/groups")).text();
    expect(html).toContain('id="group-teacher"');
    expect(html).toContain("fillTeacherOptions");
    expect(html).toContain("t-math-only");
    expect(html).toContain("t-physics-only");
    // the raw teacher_name <input> from before 2026-07-13 should be gone
    expect(html).not.toContain('name="teacher_name"');
  });

  it("drops a group referencing an unknown subject slug instead of storing it raw", async () => {
    const form = new FormData();
    form.set("teacher_name", "أ. حقن");
    form.set("subject", "<script>alert(1)</script>");
    await adminFetch("https://example.com/admin/groups", { method: "POST", body: form });
    const row = await env.DB.prepare("SELECT * FROM groups WHERE teacher_name = 'أ. حقن'").first();
    expect(row).toBeFalsy();
  });

  it("toggling a group flips its active flag", async () => {
    const { meta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. تجربة', 'math', 1)"
    ).run();
    const id = meta.last_row_id;
    await adminFetch(`https://example.com/admin/groups/${id}/toggle`, { method: "POST" });
    const row = await env.DB.prepare("SELECT active FROM groups WHERE id = ?").bind(id).first();
    expect(row?.active).toBe(0);
  });

  it("rejects a clerk creating/toggling a room or group — pricing/schedule setup is owner-only (claude-review, PR #9 finding #1)", async () => {
    const roomForm = new FormData();
    roomForm.set("name", "قاعة كليرك");
    expect((await clerkFetch("https://example.com/admin/rooms", { method: "POST", body: roomForm })).status).toBe(403);
    expect(await env.DB.prepare("SELECT id FROM rooms WHERE name = 'قاعة كليرك'").first()).toBeFalsy();

    await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('t-clerk-blocked', 'أ. كليرك', 'math')").run();
    const groupForm = new FormData();
    groupForm.set("teacher_id", "t-clerk-blocked");
    groupForm.set("subject", "math");
    expect((await clerkFetch("https://example.com/admin/groups", { method: "POST", body: groupForm })).status).toBe(403);
    expect(await env.DB.prepare("SELECT id FROM groups WHERE teacher_name = 'أ. كليرك'").first()).toBeFalsy();

    const { meta } = await env.DB.prepare("INSERT INTO groups (teacher_name, subject, active) VALUES ('أ. تبديل', 'math', 1)").run();
    expect((await clerkFetch(`https://example.com/admin/groups/${meta.last_row_id}/toggle`, { method: "POST" })).status).toBe(403);
  });

  it("clamps capacity=0 to null (unlimited-looking) instead of storing it raw — 0 should never be treated as a real cap (claude-review, PR #9 finding #2)", async () => {
    await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('t-cap-zero', 'أ. صفر', 'math')").run();
    const form = new FormData();
    form.set("teacher_id", "t-cap-zero");
    form.set("subject", "math");
    form.set("capacity", "0");
    await adminFetch("https://example.com/admin/groups", { method: "POST", body: form });
    const row = await env.DB.prepare("SELECT capacity FROM groups WHERE teacher_name = 'أ. صفر'").first();
    expect(row?.capacity).toBeNull();
  });

  it("doesn't attach a room_id that doesn't exist in the rooms table (claude-review, PR #9 finding #3)", async () => {
    await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('t-bogus-room', 'أ. قاعة وهمية', 'math')").run();
    const form = new FormData();
    form.set("teacher_id", "t-bogus-room");
    form.set("subject", "math");
    form.set("room_id", "999999");
    await adminFetch("https://example.com/admin/groups", { method: "POST", body: form });
    const row = await env.DB.prepare("SELECT room_id FROM groups WHERE teacher_name = 'أ. قاعة وهمية'").first();
    expect(row?.room_id).toBeNull();
  });
});

describe("bookings: group_id linkage + drop/transfer lifecycle (added 2026-07-13)", () => {
  async function processForm(id: number, extra: Record<string, string>) {
    const form = new FormData();
    form.set("name", "Group Link Test");
    form.set("school", "Test School");
    form.set("stage", "أولى ثانوي");
    form.set("phone", "01000000005");
    form.set("parent_phone", "01111111115");
    form.set("payment_method", "cash");
    for (const [k, v] of Object.entries(extra)) form.append(k, v);
    return adminFetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });
  }

  it("attaches a booking to a group via b_group and preserves it", async () => {
    const { meta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, day, time, price, capacity, active) VALUES ('أ. جروب', 'math', 'السبت', '5PM', 300, 10, 1)"
    ).run();
    const groupId = meta.last_row_id;
    const id = await insertStudent({ name: "Group Link Test", status: "pending", subjects: "math" });
    await processForm(id, { b_subject: "math", b_group: String(groupId), b_teacher: "أ. جروب", b_schedule: "السبت 5PM", b_amount: "300" });

    const row = await env.DB.prepare("SELECT group_id FROM bookings WHERE student_id = ?").bind(id).first();
    expect(row?.group_id).toBe(groupId);
  });

  it("a booking left without a group (free text) stores a null group_id", async () => {
    const id = await insertStudent({ name: "No Group Test", status: "pending", subjects: "math" });
    await processForm(id, { b_subject: "math", b_teacher: "أ. حر", b_schedule: "", b_amount: "100" });
    const row = await env.DB.prepare("SELECT group_id FROM bookings WHERE student_id = ?").bind(id).first();
    expect(row?.group_id).toBeFalsy();
  });

  it("a clerk can drop a booking — day-to-day per-student ops stay clerk-accessible, unlike room/group setup", async () => {
    const id = await insertStudent({ name: "Clerk Drop Test", status: "approved", subjects: "math" });
    const { meta } = await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, teacher_name, schedule, amount) VALUES (?, 'math', 'أ. كليرك دروب', '', 300)"
    ).bind(id).run();
    const form = new FormData();
    form.set("reason", "test");
    const res = await clerkFetch(`https://example.com/admin/bookings/${meta.last_row_id}/drop`, { method: "POST", body: form });
    expect(res.status).toBe(200);
    const row = await env.DB.prepare("SELECT status FROM bookings WHERE id = ?").bind(meta.last_row_id).first();
    expect(row?.status).toBe("dropped");
  });

  it("dropping a booking excludes it from getBookings/the active total but keeps the row with its reason", async () => {
    const id = await insertStudent({ name: "Drop Test", status: "approved", subjects: "math" });
    const { meta } = await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, teacher_name, schedule, amount) VALUES (?, 'math', 'أ. أحمد', '', 300)"
    ).bind(id).run();
    const bookingId = meta.last_row_id;

    const form = new FormData();
    form.set("reason", "حذف لتكرار الغياب");
    const res = await adminFetch(`https://example.com/admin/bookings/${bookingId}/drop`, { method: "POST", body: form });
    expect(res.status).toBe(200); // follows the 303 redirect to the estamara page

    const active = await env.DB.prepare("SELECT * FROM bookings WHERE student_id = ? AND status = 'active'").bind(id).all();
    expect(active.results.length).toBe(0);

    const dropped = await env.DB.prepare("SELECT status, status_reason FROM bookings WHERE id = ?").bind(bookingId).first();
    expect(dropped?.status).toBe("dropped");
    expect(dropped?.status_reason).toBe("حذف لتكرار الغياب");

    const estamaraHtml = await (await adminFetch(`https://example.com/admin/students/${id}/estamara`)).text();
    expect(estamaraHtml).toContain("حذف لتكرار الغياب");
    // Regression (found visually in a real browser, not caught by the assertion
    // above): droppedBookingsHtml() nests html`` calls inside an outer html``
    // template without wrapping them in raw() first, so the outer tag re-escapes
    // already-escaped markup — the reason text itself still renders fine (no
    // special characters to mangle), but the surrounding <br><small> tags showed
    // up as literal "&lt;br&gt;&lt;small&gt;" text instead of being real HTML.
    expect(estamaraHtml).toContain("<br><small>");
    expect(estamaraHtml).not.toContain("&lt;br&gt;");
  });

  it("re-processing a student keeps their dropped-booking history instead of wiping it (regression: DELETE was previously unscoped to status)", async () => {
    const id = await insertStudent({ name: "Reprocess Keeps History", status: "approved", subjects: "math" });
    const { meta } = await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, teacher_name, schedule, amount, status, status_reason) VALUES (?, 'math', 'أ. قديم', '', 300, 'dropped', 'حذف للأنتقال لمجموعة أخرى')"
    ).bind(id).run();
    const droppedId = meta.last_row_id;

    await processForm(id, { b_subject: "math", b_teacher: "أ. جديد", b_schedule: "", b_amount: "300" });

    const stillThere = await env.DB.prepare("SELECT status FROM bookings WHERE id = ?").bind(droppedId).first();
    expect(stillThere?.status).toBe("dropped");
    const active = await env.DB.prepare("SELECT * FROM bookings WHERE student_id = ? AND status = 'active'").bind(id).all();
    expect(active.results.length).toBe(1);
    expect(active.results[0].teacher_name).toBe("أ. جديد");
  });
});

// Seeds a real 'clerk' row first — with an empty staff table, getStaffRole()'s
// bootstrap rule would resolve this email to 'owner' too, defeating the point.
async function clerkFetch(path: string, init?: RequestInit) {
  await env.DB.prepare("INSERT OR IGNORE INTO staff (email, role) VALUES ('clerk@test.local', 'clerk')").run();
  return SELF.fetch(path, {
    ...init,
    headers: { ...(init?.headers || {}), "Cf-Access-Authenticated-User-Email": "clerk@test.local", "Cf-Access-Jwt-Assertion": "test" }
  });
}

describe("staff roles: owner-only routes (added 2026-07-13)", () => {
  it("a clerk is blocked from the ledger, teacher list, teacher settlement, and staff management", async () => {
    expect((await clerkFetch("https://example.com/admin/ledger")).status).toBe(403);
    expect((await clerkFetch("https://example.com/admin/ledger/expense", { method: "POST", body: new FormData() })).status).toBe(403);
    expect((await clerkFetch("https://example.com/admin/teachers")).status).toBe(403);
    expect((await clerkFetch("https://example.com/admin/teachers/1/settlement")).status).toBe(403);
    expect((await clerkFetch("https://example.com/admin/staff")).status).toBe(403);
  });

  it("a clerk can still reach ordinary staff routes (registration, attendance, groups)", async () => {
    expect((await clerkFetch("https://example.com/admin")).status).toBe(200);
    expect((await clerkFetch("https://example.com/admin/groups")).status).toBe(200);
    expect((await clerkFetch("https://example.com/admin/today")).status).toBe(200);
  });

  it("with an empty staff table (bootstrap mode), any Access-authenticated email is treated as owner", async () => {
    // Explicitly cleared, not relying on file/test load order — other tests in
    // this shared-state file may already have seeded rows by the time this runs.
    await env.DB.prepare("DELETE FROM staff").run();
    const res = await SELF.fetch("https://example.com/admin/ledger", {
      headers: { "Cf-Access-Authenticated-User-Email": "nobody-registered-yet@test.local", "Cf-Access-Jwt-Assertion": "test" }
    });
    expect(res.status).toBe(200);
  });

  it("with staff seeded, an unrecognized-but-Access-authenticated email defaults to clerk, not owner (regression: the naive version would fall through to owner)", async () => {
    await env.DB.prepare("INSERT INTO staff (email, role) VALUES ('someone-else@test.local', 'clerk')").run();
    const res = await SELF.fetch("https://example.com/admin/ledger", {
      headers: { "Cf-Access-Authenticated-User-Email": "totally-unknown@test.local", "Cf-Access-Jwt-Assertion": "test" }
    });
    expect(res.status).toBe(403);
  });

  it("a deactivated clerk is blocked from /admin entirely, not silently downgraded to a working clerk session (claude-review, PR #12 follow-up round)", async () => {
    await env.DB.prepare("INSERT INTO staff (email, role, active) VALUES ('fired-clerk@test.local', 'clerk', 0)").run();
    const res = await SELF.fetch("https://example.com/admin", {
      headers: { "Cf-Access-Authenticated-User-Email": "fired-clerk@test.local", "Cf-Access-Jwt-Assertion": "test" }
    });
    expect(res.status).toBe(403);
  });

  it("a deactivated owner is blocked from /admin entirely, not silently downgraded to clerk", async () => {
    await env.DB.prepare("INSERT INTO staff (email, role, active) VALUES ('fired-owner@test.local', 'owner', 0)").run();
    const res = await SELF.fetch("https://example.com/admin/ledger", {
      headers: { "Cf-Access-Authenticated-User-Email": "fired-owner@test.local", "Cf-Access-Jwt-Assertion": "test" }
    });
    expect(res.status).toBe(403);
  });

  it("a viewer can read ordinary staff pages but is blocked from any POST (mutation) route, unlike a clerk", async () => {
    await env.DB.prepare("INSERT INTO staff (email, role) VALUES ('viewer@test.local', 'viewer')").run();
    const viewerHeaders = { "Cf-Access-Authenticated-User-Email": "viewer@test.local", "Cf-Access-Jwt-Assertion": "test" };
    const getRes = await SELF.fetch("https://example.com/admin", { headers: viewerHeaders });
    expect(getRes.status).toBe(200);

    const id = await insertStudent({ name: "Viewer Block Test", status: "approved" });
    await env.DB.prepare("INSERT INTO bookings (student_id, subject, amount, status) VALUES (?, 'math', 300, 'active')").bind(id).run();
    const payForm = new FormData();
    payForm.set("amount", "50");
    const postRes = await SELF.fetch(`https://example.com/admin/students/${id}/pay`, { method: "POST", body: payForm, headers: viewerHeaders });
    expect(postRes.status).toBe(403);
    const payment = await env.DB.prepare("SELECT id FROM payments WHERE student_id = ?").bind(id).first();
    expect(payment).toBeFalsy();
  });

  it("recording a payment and an expense both stamp created_by with the acting staff member's email", async () => {
    const id = await insertStudent({ name: "Stamp Test", status: "approved" });
    await env.DB.prepare("INSERT INTO bookings (student_id, subject, amount, status) VALUES (?, 'math', 300, 'active')").bind(id).run();
    const payForm = new FormData();
    payForm.set("amount", "50");
    await adminFetch(`https://example.com/admin/students/${id}/pay`, { method: "POST", body: payForm });
    const payment = await env.DB.prepare("SELECT created_by FROM payments WHERE student_id = ?").bind(id).first();
    expect(payment?.created_by).toBe("staff@test.local");

    const expenseForm = new FormData();
    expenseForm.set("category", "rent");
    expenseForm.set("amount", "200");
    await adminFetch("https://example.com/admin/ledger/expense", { method: "POST", body: expenseForm });
    const expense = await env.DB.prepare("SELECT created_by FROM ledger WHERE category = 'rent' AND amount = 200").first();
    expect(expense?.created_by).toBe("staff@test.local");
  });
});

describe("/admin/staff management (added 2026-07-13)", () => {
  it("adds a staff member and their role shows on the list", async () => {
    const form = new FormData();
    form.set("email", "NewClerk@Test.local");
    form.set("name", "New Clerk");
    form.set("role", "clerk");
    await adminFetch("https://example.com/admin/staff", { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT email, name, role FROM staff WHERE name = 'New Clerk'").first();
    expect(row?.email).toBe("newclerk@test.local"); // lowercased on write
    expect(row?.role).toBe("clerk");
  });

  it("rejects an unknown role instead of storing it raw", async () => {
    const form = new FormData();
    form.set("email", "bad-role@test.local");
    form.set("role", "<script>alert(1)</script>");
    await adminFetch("https://example.com/admin/staff", { method: "POST", body: form });
    const row = await env.DB.prepare("SELECT * FROM staff WHERE email = 'bad-role@test.local'").first();
    expect(row).toBeFalsy();
  });

  it("toggling a staff member flips their active flag", async () => {
    await env.DB.prepare("INSERT INTO staff (email, role) VALUES ('toggle@test.local', 'clerk')").run();
    await adminFetch("https://example.com/admin/staff/toggle%40test.local/toggle", { method: "POST" });
    const row = await env.DB.prepare("SELECT active FROM staff WHERE email = 'toggle@test.local'").first();
    expect(row?.active).toBe(0);
  });

  it("rejects deactivating the sole active owner with a 400, and leaves them active (claude-review finding #3 on PR #12)", async () => {
    // adminFetch() itself re-seeds 'staff@test.local' as owner via INSERT OR
    // IGNORE on every call — target that same email so the toggle request's
    // own adminFetch call doesn't silently add a second owner behind our back.
    await env.DB.prepare("DELETE FROM staff").run();
    await env.DB.prepare("INSERT INTO staff (email, role) VALUES ('staff@test.local', 'owner')").run();
    const res = await adminFetch("https://example.com/admin/staff/staff%40test.local/toggle", { method: "POST" });
    expect(res.status).toBe(400);
    const row = await env.DB.prepare("SELECT active FROM staff WHERE email = 'staff@test.local'").first();
    expect(row?.active).toBe(1);
  });

  it("rejects demoting the sole active owner to clerk with a 400 (claude-review finding #3 on PR #12)", async () => {
    await env.DB.prepare("DELETE FROM staff").run();
    await env.DB.prepare("INSERT INTO staff (email, role) VALUES ('staff@test.local', 'owner')").run();
    const form = new FormData();
    form.set("email", "staff@test.local");
    form.set("role", "clerk");
    const res = await adminFetch("https://example.com/admin/staff", { method: "POST", body: form });
    expect(res.status).toBe(400);
    const row = await env.DB.prepare("SELECT role FROM staff WHERE email = 'staff@test.local'").first();
    expect(row?.role).toBe("owner");
  });

  it("allows deactivating an owner when another active owner remains", async () => {
    await env.DB.prepare("INSERT INTO staff (email, role) VALUES ('owner-a@test.local', 'owner')").run();
    await env.DB.prepare("INSERT INTO staff (email, role) VALUES ('owner-b@test.local', 'owner')").run();
    const res = await adminFetch("https://example.com/admin/staff/owner-a%40test.local/toggle", { method: "POST" });
    expect(res.status).not.toBe(400);
    const row = await env.DB.prepare("SELECT active FROM staff WHERE email = 'owner-a@test.local'").first();
    expect(row?.active).toBe(0);
  });
});

describe("/admin/guide", () => {
  it("the owner section documents that multiple staff can hold the owner role", async () => {
    const html = await (await adminFetch("https://example.com/admin/guide")).text();
    expect(html).toContain("أي عدد من الموظفين كـ\"مدير\"");
  });
});

describe("/admin/teachers/:id/settlement: payout math (added 2026-07-13)", () => {
  // computeTeacherOwed() matches groups by teacher_name string equality (see
  // the Phase 4 code comment) — every teacher/group pair here needs a unique
  // name, or two tests in this same shared-state file would pick up each
  // other's groups/attendance.
  let settleCounter = 0;
  async function makeTeacherWithGroup(shareType: string, shareValue: number) {
    settleCounter++;
    const teacherId = `settle-${shareType}-${settleCounter}`;
    const teacherName = `أ. تسوية ${settleCounter}`;
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, share_type, share_value) VALUES (?, ?, 'math', ?, ?)"
    ).bind(teacherId, teacherName, shareType, shareValue).run();
    const { meta: groupMeta } = await env.DB.prepare(
      "INSERT INTO groups (teacher_name, subject, active) VALUES (?, 'math', 1)"
    ).bind(teacherName).run();
    return { teacherId, groupId: groupMeta.last_row_id as number };
  }

  it("per_session: owed = share_value * attendance rows logged against the teacher's groups", async () => {
    const { teacherId, groupId } = await makeTeacherWithGroup("per_session", 20);
    const s1 = await insertStudent({ name: "Settle Session 1", status: "approved" });
    const s2 = await insertStudent({ name: "Settle Session 2", status: "approved" });
    await SELF.fetch(`https://example.com/scan?student=${s1}&group=${groupId}`);
    await SELF.fetch(`https://example.com/scan?student=${s2}&group=${groupId}`);

    const html = await (await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`)).text();
    expect(html).toContain("40.00"); // 2 sessions * 20 EGP/session
  });

  it("percent: owed = share_value% of payments actually collected against the teacher's groups, not the billed amount (claude-review finding #1 on PR #12)", async () => {
    const { teacherId, groupId } = await makeTeacherWithGroup("percent", 10);
    const s1 = await insertStudent({ name: "Settle Percent 1", status: "approved" });
    const { meta } = await env.DB.prepare(
      "INSERT INTO bookings (student_id, subject, amount, group_id, status) VALUES (?, 'math', 500, ?, 'active')"
    ).bind(s1, groupId).run();
    // Only half collected so far — owed must track the payment, not the 500 billed.
    await env.DB.prepare(
      "INSERT INTO payments (student_id, booking_id, amount) VALUES (?, ?, 250)"
    ).bind(s1, meta.last_row_id).run();

    const html = await (await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`)).text();
    expect(html).toContain("25.00"); // 10% of 250 collected, not 10% of 500 billed
  });

  it("recording a payout inserts a ledger expense row tagged teacher_payout", async () => {
    const { teacherId } = await makeTeacherWithGroup("per_session", 20);
    const form = new FormData();
    form.set("from", "2026-01-01");
    form.set("to", "2026-01-01");
    form.set("amount", "40");
    form.set("note", "January");
    await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT kind, category, amount, note FROM ledger WHERE category = 'teacher_payout'").first();
    expect(row?.kind).toBe("expense");
    expect(row?.amount).toBe(40);
    expect(row?.note).toContain("January");
  });

  it("paying less than owed doesn't close the period -- the shortfall stays owed on the next settlement instead of being silently written off (claude-review finding #1, new session)", async () => {
    const { teacherId, groupId } = await makeTeacherWithGroup("per_session", 20);
    const student = await insertStudent({ name: "Underpay Test", status: "approved" });
    await env.DB.prepare("INSERT INTO attendance (student_id, group_id, scanned_at) VALUES (?, ?, datetime('now', '-2 days'))").bind(student, groupId).run();
    await env.DB.prepare("INSERT INTO attendance (student_id, group_id) VALUES (?, ?)").bind(student, groupId).run();
    // owed = 40 (2 sessions * 20), but only 20 is actually paid.
    const form = new FormData();
    form.set("from", "2000-01-01");
    form.set("to", new Date().toISOString().slice(0, 10));
    form.set("amount", "20");
    await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT period_to FROM ledger WHERE category = 'teacher_payout' AND amount = 20").first();
    expect(row?.period_to).toBeNull(); // underpaid -- must not record a closing period_to

    // The next settlement (no explicit from/to, so it uses lastPayoutFrom())
    // must show the REMAINING 20 owed (40 total minus the 20 already paid
    // toward this still-open period), not the full original 40 again --
    // showing the full amount again would let the owner double-pay the
    // teacher (claude-review finding #1, this session's continuation).
    const settlementHtml = await (await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`)).text();
    expect(settlementHtml).toContain("20.00");
    expect(settlementHtml).not.toContain("40.00");
  });

  it("paying at least what's owed does close the period, recording the submitted 'to' as period_to", async () => {
    const { teacherId, groupId } = await makeTeacherWithGroup("per_session", 20);
    const student = await insertStudent({ name: "Full Pay Test", status: "approved" });
    await env.DB.prepare("INSERT INTO attendance (student_id, group_id) VALUES (?, ?)").bind(student, groupId).run();
    const to = new Date().toISOString().slice(0, 10);
    const form = new FormData();
    form.set("from", "2000-01-01");
    form.set("to", to);
    form.set("amount", "20"); // exactly owed
    await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT period_to FROM ledger WHERE category = 'teacher_payout' AND amount = 20 ORDER BY id DESC LIMIT 1").first();
    expect(row?.period_to).toBe(to);
  });

  it("paying the exact owed amount closes the period even when share math drifts in floating point (opus review, same session)", async () => {
    // 20.1 * 3 = 60.30000000000004 in JS float math -- the settlement form
    // prefills the displayed/paid amount as owed.toFixed(2) = "60.30", which
    // parses back to 60.3. A raw `amount >= owed` comparison fails here.
    const { teacherId, groupId } = await makeTeacherWithGroup("per_session", 20.1);
    for (let i = 0; i < 3; i++) {
      const student = await insertStudent({ name: `FP Drift Test ${i}`, status: "approved" });
      await env.DB.prepare("INSERT INTO attendance (student_id, group_id) VALUES (?, ?)").bind(student, groupId).run();
    }
    const to = new Date().toISOString().slice(0, 10);
    const form = new FormData();
    form.set("from", "2000-01-01");
    form.set("to", to);
    form.set("amount", "60.30");
    await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT period_to FROM ledger WHERE category = 'teacher_payout' AND amount = 60.3 ORDER BY id DESC LIMIT 1").first();
    expect(row?.period_to).toBe(to);
  });

  it("submitted 'from' on the settlement POST is ignored -- a stale/tampered date can't permanently write off older unpaid sessions (claude-review finding #1, this session's continuation)", async () => {
    const { teacherId, groupId } = await makeTeacherWithGroup("per_session", 20);
    const oldStudent1 = await insertStudent({ name: "Old Session Student 1", status: "approved" });
    const oldStudent2 = await insertStudent({ name: "Old Session Student 2", status: "approved" });
    await env.DB.prepare("INSERT INTO attendance (student_id, group_id, scanned_at) VALUES (?, ?, datetime('now', '-10 days'))").bind(oldStudent1, groupId).run();
    await env.DB.prepare("INSERT INTO attendance (student_id, group_id, scanned_at) VALUES (?, ?, datetime('now', '-10 days'))").bind(oldStudent2, groupId).run();
    const newStudent = await insertStudent({ name: "New Session Student", status: "approved" });
    await env.DB.prepare("INSERT INTO attendance (student_id, group_id) VALUES (?, ?)").bind(newStudent, groupId).run();
    // Real owed since the teacher's real baseline (lastPayoutFrom's default
    // "2000-01-01", no prior payout) is 60 (3 sessions * 20). A fat-fingered
    // or tampered `from` narrows the window to "today only" (1 session = 20)
    // and pays exactly that -- must be ignored server-side.
    const today = new Date().toISOString().slice(0, 10);
    const form = new FormData();
    form.set("from", today);
    form.set("to", today);
    form.set("amount", "20");
    await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`, { method: "POST", body: form });

    // Must NOT close the period -- the real owed (60) wasn't fully paid, only
    // the fake narrow window's 20 was.
    const row = await env.DB.prepare("SELECT period_to FROM ledger WHERE category = 'teacher_payout' AND amount = 20").first();
    expect(row?.period_to).toBeNull();

    // The two older sessions must still be counted next time -- not silently
    // written off by a period_to that jumped past them.
    const settlementHtml = await (await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`)).text();
    expect(settlementHtml).toContain("40.00"); // 60 real owed minus the 20 already paid
  });

  it("the settlement page's default date range matches what /admin/teachers just flagged as owed, not a 'today only' window (claude-review finding #1 on a later PR #12 review round)", async () => {
    const { teacherId, groupId } = await makeTeacherWithGroup("per_session", 15);
    const student = await insertStudent({ name: "Settle Range Test", status: "approved" });
    // 3 days ago — a settlement default of "today" alone would miss this
    // entirely, even though the list page's "since last payout" range covers it.
    await env.DB.prepare(
      "INSERT INTO attendance (student_id, group_id, scanned_at) VALUES (?, ?, datetime('now', '-3 days'))"
    ).bind(student, groupId).run();

    const listHtml = await (await adminFetch("https://example.com/admin/teachers")).text();
    expect(listHtml).toContain("15.00");

    const settlementHtml = await (await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`)).text();
    expect(settlementHtml).toContain("15.00");
  });

  it("the next settlement excludes the day already paid through, instead of double-counting/double-paying it (claude-review, follow-up round on PR #12)", async () => {
    const { teacherId, groupId } = await makeTeacherWithGroup("per_session", 10);
    const student = await insertStudent({ name: "Boundary Day Test", status: "approved" });
    const periodTo = await env.DB.prepare("SELECT date('now', '-2 days') AS d").first();
    // Attendance on the day the payout below settles through.
    await env.DB.prepare(
      "INSERT INTO attendance (student_id, group_id, scanned_at) VALUES (?, ?, datetime('now', '-2 days'))"
    ).bind(student, groupId).run();

    const payoutForm = new FormData();
    payoutForm.set("from", "2000-01-01");
    payoutForm.set("to", periodTo.d as string);
    payoutForm.set("amount", "10");
    await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`, { method: "POST", body: payoutForm });

    // A second, later session — the only one the next settlement should count.
    await env.DB.prepare("INSERT INTO attendance (student_id, group_id) VALUES (?, ?)").bind(student, groupId).run();

    const settlementHtml = await (await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`)).text();
    expect(settlementHtml).toContain("10.00"); // only the new session — 20.00 would mean the paid day was counted again
  });

  it("a settlement's 'to' date persists as period_to, not the recording timestamp (claude-review finding #2 on PR #12)", async () => {
    const { teacherId } = await makeTeacherWithGroup("per_session", 20);
    const form = new FormData();
    form.set("from", "2026-01-01");
    form.set("to", "2026-01-31"); // period end, deliberately far from "now"
    form.set("amount", "20");
    await adminFetch(`https://example.com/admin/teachers/${teacherId}/settlement`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT period_to FROM ledger WHERE category = 'teacher_payout' AND period_to = '2026-01-31'").first();
    expect(row?.period_to).toBe("2026-01-31");
  });

  it("a teacher name containing a LIKE wildcard (%) doesn't over-match another teacher's payout note (claude-review finding #5 on PR #12)", async () => {
    await env.DB.prepare("INSERT INTO teachers (id, name, subject, share_type, share_value) VALUES ('wild-a', 'أ. علي', 'math', 'per_session', 10)").run();
    await env.DB.prepare("INSERT INTO teachers (id, name, subject, share_type, share_value) VALUES ('wild-b', 'أ. علي%', 'math', 'per_session', 10)").run();
    // A payout for 'أ. علي' (no wildcard) must not appear as a match for 'أ. علي%'
    // once its name is escaped — an unescaped LIKE would treat the literal '%'
    // in the second teacher's name as a wildcard and match the first's note too.
    await env.DB.prepare("INSERT INTO ledger (kind, category, amount, note) VALUES ('expense', 'teacher_payout', 15, 'أ. علي — test')").run();
    const lastPayout = await env.DB.prepare(
      "SELECT MAX(COALESCE(period_to, occurred_at)) AS d FROM ledger WHERE category = 'teacher_payout' AND note LIKE ? ESCAPE '\\'"
    ).bind("أ. علي\\%%").first();
    expect(lastPayout?.d).toBeFalsy();
  });

  it("setting a teacher's share persists share_type and share_value", async () => {
    const { meta } = await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('share-test', 'أ. شير', 'math')").run();
    const form = new FormData();
    form.set("share_type", "percent");
    form.set("share_value", "15");
    await adminFetch("https://example.com/admin/teachers/share-test/share", { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT share_type, share_value FROM teachers WHERE id = 'share-test'").first();
    expect(row?.share_type).toBe("percent");
    expect(row?.share_value).toBe(15);
  });
});

describe("/admin/teachers: subject grouping + needs-attention ordering (added 2026-07-14)", () => {
  it("a teacher with no share configured appears in the needs-attention section", async () => {
    await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('no-share-teacher', 'أ. لسه', 'math')").run();
    const html = await (await adminFetch("https://example.com/admin/teachers")).text();
    const nameIdx = html.indexOf("أ. لسه");
    expect(nameIdx).toBeGreaterThan(-1);
    expect(html).toContain("لسه معملتش تسوية"); // "no share set yet" label still shown
  });

  it("a fully-settled teacher (share configured, zero owed since last payout) is not flagged as needing attention", async () => {
    await env.DB.prepare(
      "INSERT INTO teachers (id, name, subject, share_type, share_value) VALUES ('settled-teacher', 'أ. متسوي', 'physics', 'per_session', 20)"
    ).run();
    // No attendance logged against this teacher's groups at all, so owed = 0
    // regardless of date range — should not appear in the attention section.
    const html = await (await adminFetch("https://example.com/admin/teachers")).text();
    const attentionHeadingIdx = html.indexOf("⚠️");
    const nameIdx = html.indexOf("أ. متسوي");
    expect(nameIdx).toBeGreaterThan(-1);
    // Appears only in its subject section (after the attention heading + its
    // own empty-state text), not inside the attention list itself.
    expect(nameIdx).toBeGreaterThan(attentionHeadingIdx);
  });

  it("groups teachers under subject section headings in the site's canonical subject order", async () => {
    await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('bio-teacher', 'أ. أحياء تجربة', 'biology')").run();
    await env.DB.prepare("INSERT INTO teachers (id, name, subject) VALUES ('math-teacher-group', 'أ. رياضة تجربة', 'math')").run();
    const html = await (await adminFetch("https://example.com/admin/teachers")).text();
    // SUBJECTS lists math before biology — math's <h2> should appear first.
    expect(html.indexOf(">رياضيات<")).toBeLessThan(html.indexOf(">أحياء<"));
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

