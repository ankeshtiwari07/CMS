#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// HUMAIN Create CMS — Hybrid round-trip verification (LEAP D4)
//
// Proves the acceptance principle: an AGENT-generated artefact stays fully
// MANUALLY editable, and a manually-edited artefact stays fully ADDRESSABLE by
// the agent — round-tripping without one path breaking the other.
//
//   AI_URL=http://ai-service:4000 CMS_URL=http://cms:3001 node qa/hybrid-roundtrip.mjs
// ─────────────────────────────────────────────────────────────────────────────
const AI = process.env.AI_URL || "http://ai-service:4000";
const CMS = process.env.CMS_URL || "http://cms:3001";
const PW = process.env.QA_PW || "Indiabulls@2081";

let pass = 0, fail = 0; const out = [];
const check = (name, cond, detail = "") => { if (cond) { pass++; out.push(`  \x1b[32m✓\x1b[0m ${name}`); } else { fail++; out.push(`  \x1b[31m✗ FAIL\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`); } };

async function login() {
  const r = await fetch(`${CMS}/api/users/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "admin@humain.sa", password: PW }) });
  return (await r.json()).token;
}
async function cms(tok, path, method = "GET", body) {
  const r = await fetch(`${CMS}${path}`, { method, headers: { "content-type": "application/json", Authorization: `JWT ${tok}` }, body: body ? JSON.stringify(body) : undefined });
  let j; try { j = JSON.parse(await r.text()); } catch { j = {}; }
  return { status: r.status, j };
}

async function run() {
  const tok = await login();
  const ts = Date.now().toString(36);

  // ── 1. AGENT generates a page (composed from the component library) ──
  out.push("\n\x1b[36m── 1. Agent generates ──\x1b[0m");
  const gen = await fetch(`${AI}/studio/page`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: "a product landing page for a fintech savings app", contentType: "page" }) }).then((r) => r.json());
  const blocks = gen.blocks || [];
  check("agent produced blocks", blocks.length >= 3, `${blocks.length} blocks`);
  check("blocks are library-composed (reused/delegated)", blocks.some((b) => b.componentSource === "library" || b.componentSource === "delegated"));

  const saved = await cms(tok, "/api/aiwebsites", "POST", { title: gen.title || "QA hybrid", slug: `qa-hybrid-${ts}`, contentType: "page", status: "draft", brand: gen.brand || {}, sections: blocks, html: gen.html || "" });
  const id = saved.j?.doc?.id;
  check("persisted the agent artefact", !!id, `status=${saved.status}`);

  // ── 2. MANUAL edit — change a block's content + reorder ──
  out.push("\n\x1b[36m── 2. Manual edit (edit block + reorder) ──\x1b[0m");
  const MARK = `QA_MANUAL_${ts}`;
  const edited = blocks.map((b) => ({ ...b }));
  edited[1] = { ...edited[1], html: `<section data-manual="1">${MARK}</section>` };
  [edited[0], edited[1]] = [edited[1], edited[0]]; // reorder: manual block moves to front
  const up1 = await cms(tok, `/api/aiwebsites/${id}`, "PATCH", { sections: edited });
  check("manual edit + reorder saved", up1.status < 300, `status=${up1.status}`);

  let cur = (await cms(tok, `/api/aiwebsites/${id}?depth=0`)).j;
  check("manual edit persisted", JSON.stringify(cur.sections || []).includes(MARK));
  check("reorder persisted (manual block is first)", (cur.sections?.[0]?.html || "").includes(MARK));

  // ── 3. AGENT re-addresses a DIFFERENT block — must not clobber manual edits ──
  out.push("\n\x1b[36m── 3. Agent re-addresses (regenerate another block) ──\x1b[0m");
  const targetIdx = 2 < (cur.sections?.length || 0) ? 2 : 1;
  const target = cur.sections[targetIdx];
  const beforeHtml = target.html;
  const reg = await fetch(`${AI}/studio/website/section`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteTitle: gen.title || "Page", sitePrompt: "fintech savings app landing page", brand: gen.brand || {}, section: { id: target.id || "x", kind: target.kind || "features", brief: target.brief || "a features section" } }) }).then((r) => r.json());
  check("agent regenerated the targeted block", !!reg?.html && reg.html.length > 20, `html len=${(reg?.html || "").length}`);
  const after = cur.sections.map((b, i) => (i === targetIdx ? { ...b, html: reg.html } : b));
  const up2 = await cms(tok, `/api/aiwebsites/${id}`, "PATCH", { sections: after });
  check("agent-updated artefact saved", up2.status < 300, `status=${up2.status}`);

  cur = (await cms(tok, `/api/aiwebsites/${id}?depth=0`)).j;
  check("MANUAL edit SURVIVES the agent re-address (round-trip intact)", (cur.sections?.[0]?.html || "").includes(MARK));
  check("agent DID change the targeted block", cur.sections?.[targetIdx]?.html !== beforeHtml && (cur.sections?.[targetIdx]?.html || "").length > 20);
  check("all other blocks preserved (no clobber)", (cur.sections?.length || 0) === edited.length);

  // ── cleanup ──
  await cms(tok, `/api/aiwebsites/${id}`, "DELETE").catch(() => {});

  console.log(out.join("\n"));
  console.log(`\n${fail === 0 ? "\x1b[32m" : "\x1b[31m"}RESULT: ${pass} passed, ${fail} failed\x1b[0m  (agent → manual → agent round-trip)\n`);
  process.exit(fail === 0 ? 0 : 1);
}
run().catch((e) => { console.error("HARNESS ERROR:", e.message); process.exit(2); });
