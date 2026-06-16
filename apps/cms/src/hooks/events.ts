// Emits HMAC-signed webhooks, writes the audit log, and enqueues embedding/
// indexing on content change. All side-effects are best-effort and never block
// (or fail) the underlying content mutation.
import crypto from "node:crypto";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
} from "payload";
import { PUBLISH_ROLES } from "../access/roles";

// RBAC: only PUBLISH_ROLES (publisher/siteAdmin/admin) may transition content
// to _status="published". Site-scoping for siteAdmin is enforced upstream by the
// collection's site-scoped update access (editorSiteScoped), so a siteAdmin can
// only reach — and therefore only publish — documents within its assigned sites.
export const enforcePublishPermission: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const becomingPublished = data?._status === "published" && originalDoc?._status !== "published";
  if (becomingPublished) {
    const roles: string[] = req.user?.roles ?? [];
    const canPublish = roles.some((r) => (PUBLISH_ROLES as string[]).includes(r));
    if (!canPublish) {
      throw new Error("You do not have permission to publish. Save as draft or request review.");
    }
  }
  return data;
};

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
});
connection.on("error", () => {}); // swallow connection noise; adds are guarded below

// `connection as any`: bullmq bundles ioredis@5.10 types while we resolve 5.11;
// the instances are runtime-compatible but the d.ts identities differ.
export const ragQueue = new Queue("rag", { connection: connection as any });
export const indexQueue = new Queue("index", { connection: connection as any });

// Never let a down Redis hang or break a content mutation.
async function safeAdd(queue: Queue, name: string, data: Record<string, unknown>) {
  try {
    await Promise.race([
      queue.add(name, data),
      new Promise((_, rej) => setTimeout(() => rej(new Error("redis timeout")), 500)),
    ]);
  } catch {
    /* queue unavailable — workers will reconcile on next publish */
  }
}

function sign(body: string): string {
  const secret = process.env.WEBHOOK_HMAC_SECRET || "dev";
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function emitWebhook(event: string, payload: Record<string, unknown>) {
  const targets = (process.env.WEBHOOK_TARGETS || "").split(",").filter(Boolean);
  if (targets.length === 0) return;
  const body = JSON.stringify({ event, payload, ts: Date.now() });
  const sig = sign(body);
  await Promise.allSettled(
    targets.map((url) =>
      fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-signature": sig },
        body,
      }),
    ),
  );
}

// Append an entry to the audit-log collection (best-effort).
async function audit(
  req: any,
  action: "create" | "update" | "publish" | "delete",
  collectionSlug: string,
  documentId: unknown,
  summary: string,
) {
  try {
    await req.payload.create({
      collection: "auditLog",
      data: {
        summary,
        action,
        collectionSlug,
        documentId: String(documentId),
        user: req.user?.email ?? "system",
        ip: req.headers?.get?.("x-forwarded-for") ?? req.ip ?? null,
      },
      overrideAccess: true,
    });
  } catch (err) {
    req.payload?.logger?.error?.({ err }, "audit-log write failed");
  }
}

export const emitContentEvent: CollectionAfterChangeHook = async ({
  doc, collection, operation, req,
}) => {
  const status = (doc as any)._status;
  const event = status === "published" ? "content.published" : "content.updated";
  await emitWebhook(event, { collection: collection.slug, id: doc.id, status });
  await audit(
    req,
    status === "published" ? "publish" : operation === "create" ? "create" : "update",
    collection.slug,
    doc.id,
    `${operation} ${collection.slug} #${doc.id}${status ? ` (${status})` : ""}`,
  );
  if (status === "published") {
    await safeAdd(ragQueue, "embed", { collection: collection.slug, id: doc.id });
    await safeAdd(indexQueue, "index", { collection: collection.slug, id: doc.id });
  }
  return doc;
};

export const onDelete: CollectionAfterDeleteHook = async ({ id, collection, req }) => {
  await emitWebhook("content.deleted", { collection: collection.slug, id });
  await audit(req, "delete", collection.slug, id, `delete ${collection.slug} #${id}`);
  await safeAdd(ragQueue, "delete", { collection: collection.slug, id });
  await safeAdd(indexQueue, "delete", { collection: collection.slug, id });
};
