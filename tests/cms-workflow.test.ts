// CMS API suite — RBAC, editorial workflow, audit log, HUMAIN integration.
// Run: BASE=https://create.humain.sa vitest run tests/cms-workflow.test.ts
import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.BASE || "http://localhost:3001";
const ADMIN = { email: process.env.ADMIN_EMAIL || "admin@humain.sa", password: process.env.ADMIN_PASSWORD || "" };
const TOKEN = process.env.HUMAIN_INTEGRATION_TOKEN || "";
let jwt = "";

async function login(c: { email: string; password: string }) {
  const r = await fetch(`${BASE}/api/users/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) });
  return (await r.json())?.token as string;
}

beforeAll(async () => { jwt = await login(ADMIN); });

describe("RBAC", () => {
  it("rejects unauthenticated writes to a content collection", async () => {
    const r = await fetch(`${BASE}/api/articles`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "x" }) });
    expect([401, 403]).toContain(r.status);
  });
  it("admin can read the audit log", async () => {
    const r = await fetch(`${BASE}/api/auditLog?limit=1`, { headers: { Authorization: `JWT ${jwt}` } });
    expect(r.status).toBe(200);
  });
});

describe("Editorial workflow + audit", () => {
  it("AI-generated content is created as a draft, not published", async () => {
    const r = await fetch(`${BASE}/api/publish`, { method: "POST", headers: { "content-type": "application/json", Authorization: `JWT ${jwt}` },
      body: JSON.stringify({ collection: "articles", title: "QA workflow probe", bodyMarkdown: "## probe" }) });
    const j = await r.json();
    expect(j.draft).toBe(true);
    expect(j.id).toBeTruthy();
  });
});

describe("HUMAIN integration surface", () => {
  it("manifest advertises the integration endpoints", async () => {
    const r = await fetch(`${BASE.replace(":3001", ":3000")}/api/humain/manifest`);
    const j = await r.json();
    expect(j.integrates_with).toBe("humain-create");
    expect(j.endpoints.generations).toBeTruthy();
  });
  it("integration endpoints reject unauthenticated service calls", async () => {
    const r = await fetch(`${BASE.replace(":3001", ":3000")}/api/humain/library`);
    expect(r.status).toBe(401);
  });
  it("ingests a generation with a valid service token", async () => {
    if (!TOKEN) return;
    const r = await fetch(`${BASE.replace(":3001", ":3000")}/api/humain/generations`, { method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}`, "x-tenant-id": "qa" },
      body: JSON.stringify({ type: "deck", title: "QA deck", asset: { html: "<h1>x</h1>" } }) });
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.libraryId).toBeTruthy();
  });
});
