// MCP server exposing scoped, audited tools over HUMAIN content (RAG + lexical).
//
// Two transports, one tool surface:
//   MCP_TRANSPORT=stdio (default) — spawned per-process by an external client
//     (Claude Desktop, an IDE, an agent framework). Unchanged behaviour.
//   MCP_TRANSPORT=http            — Streamable HTTP (with SSE streaming) on
//     MCP_PORT, so the server can run as a long-lived Deployment behind a
//     Service and be shared by in-cluster clients.
import { randomUUID } from "node:crypto";
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { Pool } from "pg";
import { z } from "zod";

const pool = new Pool({ connectionString: process.env.DATABASE_URI });
const AI = process.env.AI_SERVICE_URL || "http://localhost:4000";

async function audit(tool: string, args: unknown, count: number) {
  // Matches the Payload AuditLog collection schema (apps/cms/collections/AuditLog.ts).
  await pool
    .query(
      `INSERT INTO audit_log(summary, action, collection_slug, document_id, "user", diff, created_at, updated_at)
       VALUES($1, 'update', 'mcp', '-', 'mcp-agent', $2, now(), now())`,
      [`mcp:${tool} (${count} result${count === 1 ? "" : "s"})`, JSON.stringify({ args, count })],
    )
    .catch(() => {});
}

async function embedQuery(text: string): Promise<number[]> {
  const r = await fetch(`${AI}/embed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texts: [text] }) });
  const d = await r.json() as { vectors: number[][] };
  return d.vectors[0];
}

// A fresh McpServer per connection: stdio has exactly one, HTTP has one per session.
function buildServer(): McpServer {
  const server = new McpServer({ name: "humain-content", version: "1.0.0" });

  // READ: semantic search across published content.
  server.tool("content_search",
    { query: z.string(), locale: z.string().default("en"), limit: z.number().default(5) },
    async ({ query, locale, limit }) => {
      const vec = await embedQuery(query);
      const { rows } = await pool.query(
        `SELECT entity, entity_id, content, 1 - (vector <=> $1) AS score
         FROM embeddings WHERE locale=$2
         ORDER BY vector <=> $1 LIMIT $3`,
        [JSON.stringify(vec), locale, limit]
      );
      await audit("content_search", { query, locale }, rows.length);
      return { content: [{ type: "text", text: JSON.stringify(rows) }] };
    }
  );

  // READ: fetch one document by entity + id (via CMS API).
  server.tool("content_get",
    { collection: z.string(), id: z.string(), locale: z.string().default("en") },
    async ({ collection, id, locale }) => {
      const base = process.env.CMS_BASE_URL || "http://localhost:3001";
      const res = await fetch(`${base}/api/${collection}/${id}?locale=${locale}`);
      const doc = await res.json();
      await audit("content_get", { collection, id }, 1);
      return { content: [{ type: "text", text: JSON.stringify(doc) }] };
    }
  );

  // WRITE (gated): propose a draft — never publishes. Lands for human review.
  server.tool("content_propose",
    { collection: z.string(), draft: z.record(z.unknown()) },
    async ({ collection, draft }) => {
      const base = process.env.CMS_BASE_URL || "http://localhost:3001";
      const res = await fetch(`${base}/api/${collection}?draft=true`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.MCP_SERVICE_TOKEN}` },
        body: JSON.stringify({ ...draft, _status: "draft" }),
      });
      const body = await res.text();
      if (!res.ok) {
        // Don't return a success-shaped `{}` on a rejected write — the caller
        // has no way to tell that from a draft that was actually created.
        await audit("content_propose", { collection, failed: res.status }, 0);
        return { isError: true, content: [{ type: "text", text: `CMS rejected the draft (HTTP ${res.status}): ${body.slice(0, 500)}` }] };
      }
      const out = JSON.parse(body) as any;
      await audit("content_propose", { collection }, 1);
      return { content: [{ type: "text", text: JSON.stringify({ proposedDraftId: out?.doc?.id }) }] };
    }
  );

  return server;
}

// ---------------------------------------------------------------- stdio mode

async function runStdio() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// ----------------------------------------------------------------- http mode

// `cleanup` is one-shot: closing the transport fires onclose, and closing the
// McpServer closes its transport, so an unguarded pair recurses until the stack
// blows. Every teardown path (DELETE, reap, shutdown) goes through it.
type Session = { transport: StreamableHTTPServerTransport; server: McpServer; lastSeen: number; cleanup: () => Promise<void> };

// Clients that vanish without DELETE would otherwise pin a session (and its
// McpServer) forever, so idle ones are reaped.
const sessions = new Map<string, Session>();

function touch(sessionId: string) {
  const s = sessions.get(sessionId);
  if (s) s.lastSeen = Date.now();
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
  res.end(payload);
}

function rpcError(res: ServerResponse, status: number, code: number, message: string) {
  sendJson(res, status, { jsonrpc: "2.0", error: { code, message }, id: null });
}

function readBody(req: IncomingMessage, limitBytes: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limitBytes) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch { reject(new Error("invalid json")); }
    });
    req.on("error", reject);
  });
}

// Constant-time-ish comparison so a wrong token can't be recovered by timing.
function tokenMatches(presented: string, expected: string): boolean {
  if (presented.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < presented.length; i++) diff |= presented.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function runHttp() {
  const port = Number(process.env.MCP_PORT || 4100);
  const authToken = process.env.MCP_AUTH_TOKEN || "";
  if (!authToken) {
    // Fail closed: an unauthenticated MCP endpoint on the pod network exposes
    // content reads and draft writes to anything that can reach the Service.
    console.error("[mcp] MCP_AUTH_TOKEN is required when MCP_TRANSPORT=http");
    process.exit(1);
  }
  const allowedHosts = (process.env.MCP_ALLOWED_HOSTS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const allowedOrigins = (process.env.MCP_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);

  const authorized = (req: IncomingMessage) => {
    const header = req.headers.authorization || "";
    const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
    return presented !== "" && tokenMatches(presented, authToken);
  };

  const http = createHttpServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // Liveness: the process is up and serving.
    if (url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, transport: "http", sessions: sessions.size });
    }
    // Readiness: the dependencies a tool call actually needs are reachable.
    if (url.pathname === "/ready") {
      try {
        await pool.query("SELECT 1");
        return sendJson(res, 200, { ok: true, db: "up", sessions: sessions.size });
      } catch (err) {
        return sendJson(res, 503, { ok: false, db: "down", error: (err as Error).message });
      }
    }

    if (url.pathname !== "/mcp") {
      return sendJson(res, 404, { error: "not found" });
    }
    if (!authorized(req)) {
      res.setHeader("WWW-Authenticate", 'Bearer realm="humain-mcp"');
      return rpcError(res, 401, -32001, "Unauthorized");
    }

    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    try {
      if (req.method === "POST") {
        let body: unknown;
        try {
          body = await readBody(req, 4 * 1024 * 1024);
        } catch (err) {
          return rpcError(res, 400, -32700, (err as Error).message);
        }

        // Existing session: hand straight to its transport.
        if (sessionId && sessions.has(sessionId)) {
          touch(sessionId);
          return sessions.get(sessionId)!.transport.handleRequest(req, res, body);
        }
        // No session: only an `initialize` may open one.
        if (sessionId) {
          return rpcError(res, 404, -32001, "Unknown session");
        }
        if (!isInitializeRequest(body)) {
          return rpcError(res, 400, -32000, "Bad Request: no session and not an initialize request");
        }

        const server = buildServer();
        let torndown = false;
        const cleanup = async () => {
          if (torndown) return;
          torndown = true;
          if (transport.sessionId) sessions.delete(transport.sessionId);
          await transport.close().catch(() => {});
          await server.close().catch(() => {});
        };
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableDnsRebindingProtection: allowedHosts.length > 0 || allowedOrigins.length > 0,
          ...(allowedHosts.length ? { allowedHosts } : {}),
          ...(allowedOrigins.length ? { allowedOrigins } : {}),
          onsessioninitialized: (id) => {
            sessions.set(id, { transport, server, lastSeen: Date.now(), cleanup });
            console.log(`[mcp] session open ${id} (${sessions.size} active)`);
          },
          onsessionclosed: (id) => {
            console.log(`[mcp] session closed ${id} (${sessions.size - 1} active)`);
            void cleanup();
          },
        });
        transport.onclose = () => { void cleanup(); };
        await server.connect(transport);
        return transport.handleRequest(req, res, body);
      }

      // GET opens the server→client SSE stream; DELETE terminates the session.
      if (req.method === "GET" || req.method === "DELETE") {
        if (!sessionId || !sessions.has(sessionId)) {
          return rpcError(res, 404, -32001, "Unknown session");
        }
        touch(sessionId);
        return sessions.get(sessionId)!.transport.handleRequest(req, res);
      }

      res.writeHead(405, { allow: "GET, POST, DELETE" }).end();
    } catch (err) {
      console.error("[mcp] request failed", err);
      if (!res.headersSent) rpcError(res, 500, -32603, "Internal server error");
      else res.end();
    }
  });

  const idleTtlMs = Number(process.env.MCP_SESSION_TTL_MS || 30 * 60 * 1000);
  const reaper = setInterval(() => {
    const cutoff = Date.now() - idleTtlMs;
    for (const [id, s] of sessions) {
      if (s.lastSeen < cutoff) {
        console.log(`[mcp] reaping idle session ${id}`);
        void s.cleanup();
      }
    }
  }, Math.min(idleTtlMs, 60_000));
  reaper.unref();

  http.listen(port, "0.0.0.0", () => {
    console.log(`[mcp] streamable-http listening on :${port}/mcp (dns-rebinding-protection=${allowedHosts.length > 0 || allowedOrigins.length > 0})`);
  });

  const shutdown = async () => {
    console.log("[mcp] shutting down");
    clearInterval(reaper);
    for (const s of [...sessions.values()]) await s.cleanup();
    sessions.clear();
    http.close();
    await pool.end().catch(() => {});
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

const mode = (process.env.MCP_TRANSPORT || "stdio").toLowerCase();
if (mode === "http") await runHttp();
else await runStdio();
