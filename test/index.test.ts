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
