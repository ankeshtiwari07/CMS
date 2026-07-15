// Emits HMAC-signed webhooks, writes the audit log, and enqueues embedding/
// indexing on content change. All side-effects are best-effort and never block
// (or fail) the underlying content mutation.
import crypto from "node:crypto";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { APIError } from "payload";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
} from "payload";
import { PUBLISH_ROLES } from "../access/roles";
import { requiredStagesFor, STAGE_LABEL, type Stage } from "../access/approval-policy";

// Stamp the creator on first save (used for separation-of-duties at approval time).
export const setCreatedBy: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === "create" && !data.createdBy && req.user) data.createdBy = (req.user as any).id;
  return data;
};

// RBAC + HITL: to transition content to _status="published" the actor must (1) hold
// a PUBLISH_ROLE, AND (2) every approval stage required for the content's risk tier
// must be freshly approved (an edit after an approval invalidates it). This is the
// human-in-the-loop gate — automated/AI content can never publish without sign-off.
export const enforcePublishPermission: CollectionBeforeChangeHook = async ({ data, req, originalDoc, collection }) => {
  const becomingPublished = data?._status === "published" && originalDoc?._status !== "published";
  if (!becomingPublished) return data;

  const roles: string[] = req.user?.roles ?? [];
  if (!roles.some((r) => (PUBLISH_ROLES as string[]).includes(r))) {
    throw new APIError("You do not have permission to publish. Save as draft or request review.", 403);
  }

  // HITL approval gate
  const riskTier = (data?.riskTier ?? originalDoc?.riskTier ?? "low") as string;
  const aiGenerated = Boolean(data?.aiGenerated ?? originalDoc?.aiGenerated);
  const required = requiredStagesFor(riskTier, aiGenerated);
  const slug = (collection as any)?.slug;
  if (required.length && slug && originalDoc?.id != null) {
    const lastEdit = originalDoc?.updatedAt ? new Date(originalDoc.updatedAt).getTime() : 0;
    let decisions: any[] = [];
    try {
      const res = await req.payload.find({
        collection: "approvals" as any,
        where: { and: [{ collectionSlug: { equals: slug } }, { documentId: { equals: String(originalDoc.id) } }] },
        sort: "-createdAt",
        limit: 200,
        depth: 0,
        overrideAccess: true,
      });
      decisions = res.docs || [];
    } catch {
      /* if approvals can't be read, fail closed below */
    }
    const cleared = (s: Stage) => {
      const latest = decisions.find((d) => d.stage === s); // sorted desc → latest first
      return Boolean(latest && latest.decision === "approve" && new Date(latest.createdAt).getTime() >= lastEdit);
    };
    const pending = required.filter((s) => !cleared(s));
    if (pending.length) {
      const names = pending.map((s) => STAGE_LABEL[s] || s).join(", ");
      throw new APIError(
        `Cannot publish — human-in-the-loop approval incomplete. Pending: ${names}. ` +
          `(Risk tier: ${riskTier}${aiGenerated ? ", AI-generated" : ""}.) Route it through the Review queue.`,
        403,
      );
    }
  }
  return data;
};

// During the production BUILD (`payload generate:importmap` + `next build`) Redis
// is unreachable, and bullmq's infinite reconnect timers would keep the Node
// process alive forever — hanging generate:importmap so `next build` never starts.
// Skip all queue/connection setup at build time; hooks don't run during a build.
const IS_BUILD =
  process.env.CMS_BUILD === "1" || process.env.NEXT_PHASE === "phase-production-build";

const connection = IS_BUILD
  ? null
  : new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
connection?.on("error", () => {}); // swallow connection noise; adds are guarded below

// `connection as any`: bullmq bundles ioredis@5.10 types while we resolve 5.11;
// the instances are runtime-compatible but the d.ts identities differ.
export const ragQueue: Queue | null = connection ? new Queue("rag", { connection: connection as any }) : null;
export const indexQueue: Queue | null = connection ? new Queue("index", { connection: connection as any }) : null;

// Never let a down Redis hang or break a content mutation.
async function safeAdd(queue: Queue | null, name: string, data: Record<string, unknown>) {
  if (!queue) return;
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
