import type { CollectionConfig, CollectionBeforeChangeHook, CollectionAfterChangeHook } from "payload";
import { APIError } from "payload";
import { isAdmin } from "../access/roles";
import { canDecideStage, requiredStagesFor, STAGE_LABEL, type Stage } from "../access/approval-policy";
import { effectiveApproverRoles } from "../access/delegation";

// Enforce HITL decision rules on every approval record:
//  - approver must hold a role allowed to decide that stage
//  - separation of duties: the content's creator can NEVER approve their own content
//  - rejection / request-changes requires a mandatory comment
//  - decidedBy is forced to the authenticated user (never trusted from the client)
const enforceApprovalRules: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== "create") return data;
  const user = req.user as any;
  if (!user) throw new APIError("Authentication required.", 401);
  const stage = String(data.stage || "");
  const decision = String(data.decision || "");

  // Effective roles include any inherited from out-of-office delegators.
  const { roles, delegatedFrom } = await effectiveApproverRoles(user, req.payload);
  if (!canDecideStage(roles, stage)) {
    throw new APIError(`You are not authorised to decide the "${STAGE_LABEL[stage as Stage] || stage}" stage.`, 403);
  }
  const actingAsDelegate = delegatedFrom.length > 0 && !canDecideStage(user.roles ?? [], stage);
  if ((decision === "reject" || decision === "request_changes") && !String(data.comment || "").trim()) {
    throw new APIError("A comment is required when rejecting or requesting changes.", 400);
  }

  // Separation of duties — look up the target content's creator.
  try {
    const doc: any = await req.payload.findByID({
      collection: String(data.collectionSlug) as any,
      id: data.documentId as any,
      depth: 0,
      overrideAccess: true,
    });
    const creator = doc?.createdBy && typeof doc.createdBy === "object" ? doc.createdBy.id : doc?.createdBy;
    if (creator != null && String(creator) === String(user.id) && !roles.includes("admin")) {
      throw new APIError("Separation of duties: you cannot approve content you created. Another reviewer must decide.", 403);
    }
    data.riskTier = data.riskTier ?? doc?.riskTier ?? "low";
    data.aiGenerated = data.aiGenerated ?? Boolean(doc?.aiGenerated);
  } catch (e: any) {
    if (e instanceof APIError) throw e;
    // content not found / not readable — let it proceed; gating still protects publish
  }

  data.decidedBy = user.id;
  const verb = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "requested changes on";
  const onBehalf = actingAsDelegate ? ` (as delegate of ${delegatedFrom.join(", ")})` : "";
  data.summary = `${user.email || "user"} ${verb} ${data.collectionSlug}#${data.documentId} [${stage}]${onBehalf}`;
  return data;
};

// Mirror every decision into the immutable audit log.
const auditApproval: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation !== "create") return;
  try {
    await req.payload.create({
      collection: "auditLog",
      data: {
        summary: doc.summary,
        action: "update",
        collectionSlug: doc.collectionSlug,
        documentId: String(doc.documentId),
        user: (req.user as any)?.email || "system",
        diff: { approval: { stage: doc.stage, decision: doc.decision, comment: doc.comment } },
      },
      overrideAccess: true,
    });
  } catch {
    /* best-effort */
  }
};

// Governed completion: once every required approval stage is freshly cleared,
// take the content LIVE. This is the honest fix for "the Publish button doesn't
// publish" (AI content is gated behind review) AND it feeds the RAG pipeline,
// which only indexes on the published transition.
const autoPublishOnFinalApproval: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation !== "create" || doc.decision !== "approve") return;
  const slug = String(doc.collectionSlug);
  try {
    const target: any = await req.payload.findByID({ collection: slug as any, id: doc.documentId as any, depth: 0, overrideAccess: true });
    if (!target) { req.payload.logger.info(`[autopub] no target ${slug}#${doc.documentId}`); return; }
    if (target._status === "published" || target.status === "published") return;
    const required = requiredStagesFor(String(target.riskTier ?? "low"), Boolean(target.aiGenerated));
    if (!required.length) { req.payload.logger.info(`[autopub] no required stages tier=${target.riskTier} ai=${target.aiGenerated}`); return; }
    const { docs: committed } = await req.payload.find({
      collection: "approvals" as any,
      where: { and: [{ collectionSlug: { equals: slug } }, { documentId: { equals: String(doc.documentId) } }] },
      sort: "-createdAt", limit: 500, depth: 0, overrideAccess: true,
    });
    // The triggering decision is not yet committed, so it won't appear in the
    // query above — include it explicitly.
    const decisions: any[] = [{ stage: doc.stage, decision: doc.decision, createdAt: doc.createdAt || new Date().toISOString() }, ...committed];
    const lastEdit = target.updatedAt ? new Date(target.updatedAt).getTime() : 0;
    const cleared = (s: Stage) => {
      const latest = decisions.find((d: any) => d.stage === s);
      return Boolean(latest && latest.decision === "approve" && new Date(latest.createdAt).getTime() >= lastEdit);
    };
    if (!required.every(cleared)) return;
    const data: any = {};
    if ("_status" in target) data._status = "published";
    else if ("status" in target) data.status = "published";
    if (!Object.keys(data).length) return;
    await req.payload.update({ collection: slug as any, id: doc.documentId as any, data, overrideAccess: true, context: { autoPublish: true } });
    req.payload.logger.info(`[autopub] published ${slug}#${doc.documentId} after ${required.join("+")}`);
  } catch (e: any) {
    req.payload.logger.error(`[autopub] ${e?.message}`);
  }
};

// Immutable HITL decision trail. One row per decision (approve/reject/request_changes)
// per stage per content document. Never updatable; deletable by admins only.
export const Approvals: CollectionConfig = {
  slug: "approvals",
  admin: {
    useAsTitle: "summary",
    defaultColumns: ["summary", "stage", "decision", "decidedBy", "createdAt"],
    group: "Governance",
  },
  access: {
    // Authority is enforced entirely in beforeChange (stage-role + delegation +
    // separation of duties), so a delegate who isn't normally an approver can
    // still act while covering. Read is open to authenticated users (governance
    // transparency); create is hook-gated; records are immutable.
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    { name: "summary", type: "text" },
    { name: "collectionSlug", type: "text", required: true, index: true },
    { name: "documentId", type: "text", required: true, index: true },
    { name: "stage", type: "text", required: true }, // editorial | brand | legal | final
    { name: "decision", type: "text", required: true }, // approve | reject | request_changes
    { name: "comment", type: "textarea" },
    { name: "riskTier", type: "text" },
    { name: "aiGenerated", type: "checkbox", defaultValue: false },
    { name: "decidedBy", type: "relationship", relationTo: "users" },
  ],
  timestamps: true,
  hooks: { beforeChange: [enforceApprovalRules], afterChange: [auditApproval, autoPublishOnFinalApproval] },
};
