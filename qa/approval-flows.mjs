#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// HUMAIN Create CMS — Approval-flow regression harness (LEAP D3)
//
// Regresses Flow A (Editor content → multi-stage HITL approval → publish) and
// Flow B (delegated component + AI website → dual approval → publish) against a
// LIVE CMS, asserting every gate at the API level (not just the UI). Exits non-
// zero if any assertion fails, so it can run per-sprint in CI.
//
//   BASE=http://cms:3001  PW=…  node qa/approval-flows.mjs
// Users (shared demo password): author.en / reviewer / publisher / admin.
// ─────────────────────────────────────────────────────────────────────────────
const BASE = process.env.CMS_URL || process.env.BASE || "http://cms:3001";
const PW = process.env.QA_PW || process.env.PW || "Indiabulls@2081";
const U = {
  author: "author.en@humain.sa",
  reviewer: "reviewer@humain.sa",
  publisher: "publisher@humain.sa",
  admin: "admin@humain.sa",
};

let pass = 0, fail = 0;
const results = [];
function check(name, cond, detail = "") {
  if (cond) { pass++; results.push(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { fail++; results.push(`  \x1b[31m✗ FAIL\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`); }
}
const lexical = (t) => ({ root: { type: "root", format: "", indent: 0, version: 1, direction: "ltr", children: [{ type: "paragraph", format: "", indent: 0, version: 1, direction: "ltr", textFormat: 0, children: [{ type: "text", text: t, format: 0, detail: 0, mode: "normal", style: "", version: 1 }] }] } });

async function login(email) {
  const r = await fetch(`${BASE}/api/users/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: PW }) });
  const j = await r.json();
  if (!j.token) throw new Error(`login failed for ${email}: ${JSON.stringify(j).slice(0, 160)}`);
  return j.token;
}
async function api(token, path, method = "GET", body) {
  const r = await fetch(`${BASE}${path}`, { method, headers: { "content-type": "application/json", ...(token ? { Authorization: `JWT ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j; try { j = JSON.parse(await r.text()); } catch { j = {}; }
  return { status: r.status, j };
}
const approve = (tok, slug, id, stage, comment = "QA approve") => api(tok, "/api/approvals", "POST", { collectionSlug: slug, documentId: String(id), stage, decision: "approve", comment });

async function run() {
  const A = await login(U.author), R = await login(U.reviewer), P = await login(U.publisher), ADM = await login(U.admin);
  const tag = `QA-${Date.now().toString(36)}`;
  const cleanup = [];

  // ── FLOW A — Editor content, multi-stage (medium tier: editorial + final) ──
  results.push("\n\x1b[36m── Flow A — content, multi-stage HITL approval ──\x1b[0m");
  let c = await api(A, "/api/articles", "POST", { title: `${tag} article`, body: lexical("QA body."), _status: "draft", riskTier: "medium", aiGenerated: true });
  const aid = c.j?.doc?.id;
  check("Editor creates article as draft", c.status < 300 && c.j?.doc?._status === "draft", `status=${c.status} _status=${c.j?.doc?._status}`);
  if (aid) cleanup.push(["articles", aid]);

  let up = await api(P, `/api/articles/${aid}`, "PATCH", { _status: "published" });
  check("Publish BEFORE any approval → 403", up.status === 403, `got ${up.status}`);

  let ap = await approve(R, "articles", aid, "editorial");
  check("Reviewer approves editorial → 2xx", ap.status < 300, `got ${ap.status} ${ap.j?.errors?.[0]?.message || ""}`);

  up = await api(P, `/api/articles/${aid}`, "PATCH", { _status: "published" });
  check("Publish after ONLY editorial (final pending) → 403", up.status === 403, `got ${up.status}`);

  ap = await approve(P, "articles", aid, "final");
  check("Publisher approves final → 2xx", ap.status < 300, `got ${ap.status} ${ap.j?.errors?.[0]?.message || ""}`);

  up = await api(P, `/api/articles/${aid}`, "PATCH", { _status: "published" });
  check("Publish after BOTH stages cleared → 200 published", up.status < 300 && up.j?.doc?._status === "published", `status=${up.status} _status=${up.j?.doc?._status}`);

  // separation of duties: creator (author) may not approve own content
  const sod = await approve(A, "articles", aid, "editorial");
  check("Creator cannot approve own content (separation of duties) → 403", sod.status === 403, `got ${sod.status}`);

  // ── FLOW B — delegated component (dual-approval half #1) ──
  results.push("\n\x1b[36m── Flow B — delegated component ──\x1b[0m");
  const ckey = `${tag}-comp`.toLowerCase();
  c = await api(A, "/api/components", "POST", { name: `${tag} component`, key: ckey, type: "banner", category: "marketing", status: "live", aiGenerated: true, riskTier: "low", html: "<section>{{t}}</section>" });
  const cid = c.j?.doc?.id;
  check("Editor create asking status=live → forced to draft", c.j?.doc?.status === "draft", `status=${c.j?.doc?.status}`);
  if (cid) cleanup.push(["components", cid]);

  up = await api(A, `/api/components/${cid}`, "PATCH", { status: "live" });
  check("Editor publish (no publish role) → 403", up.status === 403, `got ${up.status}`);
  up = await api(P, `/api/components/${cid}`, "PATCH", { status: "live" });
  check("Publisher publish BEFORE approval → 403", up.status === 403, `got ${up.status}`);
  ap = await approve(R, "components", cid, "editorial");
  check("Reviewer approves editorial → 2xx", ap.status < 300, `got ${ap.status}`);
  up = await api(P, `/api/components/${cid}`, "PATCH", { status: "live" });
  check("Publisher publish AFTER approval → 200 live", up.status < 300 && up.j?.doc?.status === "live", `status=${up.status} → ${up.j?.doc?.status}`);

  // ── FLOW B — the page consuming it (dual-approval half #2) ──
  results.push("\n\x1b[36m── Flow B — AI website (the page) ──\x1b[0m");
  c = await api(A, "/api/aiwebsites", "POST", { title: `${tag} site`, slug: `${tag.toLowerCase()}-site`, status: "draft", aiGenerated: true, riskTier: "low", html: "<section>page</section>" });
  const wid = c.j?.doc?.id;
  check("Editor creates AI website as draft", c.status < 300 && c.j?.doc?.status === "draft", `status=${c.status}`);
  if (wid) cleanup.push(["aiwebsites", wid]);
  up = await api(P, `/api/aiwebsites/${wid}`, "PATCH", { status: "published" });
  check("Publish website BEFORE approval → 403", up.status === 403, `got ${up.status}`);
  ap = await approve(R, "aiwebsites", wid, "editorial");
  check("Reviewer approves editorial → 2xx", ap.status < 300, `got ${ap.status}`);
  up = await api(P, `/api/aiwebsites/${wid}`, "PATCH", { status: "published" });
  check("Publish website AFTER approval → 200 published", up.status < 300 && up.j?.doc?.status === "published", `status=${up.status} → ${up.j?.doc?.status}`);

  // ── Audit trail present for every gated artefact ──
  results.push("\n\x1b[36m── Immutable audit trail ──\x1b[0m");
  for (const [slug, id] of [["articles", aid], ["components", cid], ["aiwebsites", wid]]) {
    const al = await api(ADM, `/api/auditLog?where[collectionSlug][equals]=${slug}&where[documentId][equals]=${id}&limit=20&depth=0`);
    const acts = (al.j?.docs || []).map((d) => d.action);
    check(`${slug}#${id}: audit has create + publish`, acts.includes("create") && acts.includes("publish"), `actions=${acts.join(",")}`);
  }

  // ── Cleanup ──
  for (const [slug, id] of cleanup) await api(ADM, `/api/${slug}/${id}`, "DELETE").catch(() => {});

  console.log(results.join("\n"));
  console.log(`\n${fail === 0 ? "\x1b[32m" : "\x1b[31m"}RESULT: ${pass} passed, ${fail} failed\x1b[0m  (Flow A + Flow B, API-gated, audited)\n`);
  process.exit(fail === 0 ? 0 : 1);
}
run().catch((e) => { console.error("HARNESS ERROR:", e.message); process.exit(2); });
