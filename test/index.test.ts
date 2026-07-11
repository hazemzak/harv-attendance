import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

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
    const res = await SELF.fetch("https://example.com/admin");
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
    return SELF.fetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });
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

    const res = await SELF.fetch("https://example.com/admin/estamarat");
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
    const res = await SELF.fetch("https://example.com/admin/estamarat");
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name in the /admin/students/:id/estamara page title", async () => {
    const id = await insertStudent({
      name: "<script>alert(1)</script>",
      status: "approved",
    });
    const res = await SELF.fetch(`https://example.com/admin/students/${id}/estamara`);
    const html = await res.text();
    expect(html).not.toContain("<title><script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name in the /admin approved-student roster card (found by claude-review, round 2)", async () => {
    await insertStudent({
      name: "<script>alert(1)</script>",
      status: "approved",
    });
    const res = await SELF.fetch("https://example.com/admin");
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
    const res = await SELF.fetch("https://example.com/admin/today");
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
    const res = await SELF.fetch("https://example.com/admin");
    const html = await res.text();
    expect(html).not.toContain("<strong><script>alert(1)</script>");
    expect(html).not.toContain("<img src=x onerror=alert(2)>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes a malicious name on the success/handoff page (found by claude-review, round 3)", async () => {
    const id = await insertStudent({ name: "<script>alert(1)</script>", status: "approved" });
    const res = await SELF.fetch(`https://example.com/admin/students/${id}/success`);
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
    const res = await SELF.fetch("https://example.com/admin/print");
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

    const res = await SELF.fetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });
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
    await SELF.fetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT stage FROM students WHERE id = ?").bind(id).first();
    expect(row?.stage).toBe("");
  });

  it("escapes stage on the /admin/estamarat list even for a legacy row bypassing the whitelist", async () => {
    await insertStudent({
      name: "Legacy Stage Test",
      status: "approved",
      stage: "<script>alert(1)</script>",
    });
    const res = await SELF.fetch("https://example.com/admin/estamarat");
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
    const res = await SELF.fetch("https://example.com/admin");
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
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
    await SELF.fetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT amount FROM bookings WHERE student_id = ?").bind(id).first();
    expect(row?.amount).toBe(0);
  });
});

describe("/admin/students/:id/process: track whitelist", () => {
  it("drops an invalid track value instead of storing it raw", async () => {
    const id = await insertStudent({ name: "Track Test", status: "pending" });
    const form = new FormData();
    form.set("name", "Track Test");
    form.set("phone", "01000000002");
    form.set("parent_phone", "01111111113");
    form.set("payment_method", "cash");
    form.set("track", "<script>alert(1)</script>");
    await SELF.fetch(`https://example.com/admin/students/${id}/process`, { method: "POST", body: form });

    const row = await env.DB.prepare("SELECT track FROM students WHERE id = ?").bind(id).first();
    expect(row?.track).toBe("");
  });
});
