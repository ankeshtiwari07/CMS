// Scheduled publishing. Schedules live in a small ai-service table (so no Payload
// schema change is needed); a 60s sweeper publishes due drafts through the real
// governed workflow (records the editorial approval that the schedule authorises,
// then flips _status to published via the CMS REST API as an admin).
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URI });
const CMS = process.env.CMS_BASE_URL || "http://localhost:3001";
const ADMIN_EMAIL = process.env.SCHEDULER_EMAIL || "admin@humain.sa";
const ADMIN_PW = process.env.SEED_ADMIN_PASSWORD || "";

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scheduled_publishes (
      id bigserial PRIMARY KEY,
      collection text NOT NULL,
      doc_id text NOT NULL,
      publish_at timestamptz NOT NULL,
      done boolean NOT NULL DEFAULT false,
      error text,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(collection, doc_id)
    );
  `);
}

export async function addSchedule(collection: string, id: string | number, publishAt: string): Promise<void> {
  await ensureSchema();
  await pool.query(
    `INSERT INTO scheduled_publishes(collection, doc_id, publish_at)
     VALUES($1, $2, $3)
     ON CONFLICT(collection, doc_id) DO UPDATE SET publish_at = EXCLUDED.publish_at, done = false, error = null`,
    [collection, String(id), publishAt],
  );
}

export async function listSchedules(): Promise<any[]> {
  await ensureSchema();
  const { rows } = await pool.query(`SELECT collection, doc_id, publish_at, done, error FROM scheduled_publishes ORDER BY publish_at DESC LIMIT 100`);
  return rows;
}

async function adminToken(): Promise<string | null> {
  try {
    const r = await fetch(`${CMS}/api/users/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PW }) });
    const j = (await r.json()) as any;
    return j?.token || null;
  } catch { return null; }
}

async function publishOne(token: string, collection: string, id: string): Promise<{ ok: boolean; msg: string }> {
  const H = { "content-type": "application/json", Authorization: `JWT ${token}` };
  // Scheduling is the human authorisation → record the editorial approval the HITL
  // gate needs (best-effort; ignored if already approved or not required).
  try { await fetch(`${CMS}/api/approvals`, { method: "POST", headers: H, body: JSON.stringify({ collectionSlug: collection, documentId: String(id), stage: "editorial", decision: "approve", comment: "Auto-approved by scheduled publish" }) }); } catch { /* noop */ }
  const r = await fetch(`${CMS}/api/${collection}/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ _status: "published" }) });
  if (r.ok) return { ok: true, msg: "published" };
  let m = ""; try { m = ((await r.json()) as any)?.errors?.[0]?.message || ""; } catch { /* noop */ }
  return { ok: false, msg: `${r.status} ${m}`.slice(0, 160) };
}

export async function sweep(log?: (s: string) => void): Promise<number> {
  await ensureSchema();
  const { rows } = await pool.query(`SELECT id, collection, doc_id FROM scheduled_publishes WHERE done = false AND publish_at <= now() ORDER BY publish_at LIMIT 20`);
  if (!rows.length) return 0;
  const token = await adminToken();
  if (!token) { log?.("scheduled-publish: no admin token (SEED_ADMIN_PASSWORD?)"); return 0; }
  let published = 0;
  for (const row of rows) {
    try {
      const res = await publishOne(token, row.collection, String(row.doc_id));
      if (res.ok) { await pool.query(`UPDATE scheduled_publishes SET done = true, error = null WHERE id = $1`, [row.id]); published++; log?.(`scheduled-publish: published ${row.collection}#${row.doc_id}`); }
      else { await pool.query(`UPDATE scheduled_publishes SET error = $2 WHERE id = $1`, [row.id, res.msg]); log?.(`scheduled-publish: ${row.collection}#${row.doc_id} failed — ${res.msg}`); }
    } catch (e: any) { await pool.query(`UPDATE scheduled_publishes SET error = $2 WHERE id = $1`, [row.id, String(e?.message || e).slice(0, 160)]).catch(() => {}); }
  }
  return published;
}

export function startScheduledPublish(log?: (s: string) => void): void {
  ensureSchema().catch(() => {});
  setInterval(() => { sweep(log).catch((e) => log?.(`scheduled-publish sweep error: ${e?.message || e}`)); }, 60_000);
  log?.("scheduled-publish sweeper started (60s interval)");
}
