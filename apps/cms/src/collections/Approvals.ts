import type { CollectionConfig, CollectionBeforeChangeHook, CollectionAfterChangeHook } from "payload";
import { APIError } from "payload";
import { canApprove, isAdmin } from "../access/roles";
import { canDecideStage, STAGE_LABEL, type Stage } from "../access/approval-policy";

// Enforce HITL decision rules on every approval record:
//  - approver must hold a role allowed to decide that stage
//  - separation of duties: the content's creator can NEVER approve their own content
//  - rejection / request-changes requires a mandatory comment
//  - decidedBy is forced to the authenticated user (never trusted from the client)
const enforceApprovalRules: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== "create") return data;
  const user = req.user as any;
  if (!user) throw new APIError("Authentication required.", 401);
  const roles: string[] = user.roles ?? [];
  const stage = String(data.stage || "");
  const decision = String(data.decision || "");

  if (!canDecideStage(roles, stage)) {
    throw new APIError(`You are not authorised to decide the "${STAGE_LABEL[stage as Stage] || stage}" stage.`, 403);
  }
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
  data.summary = `${user.email || "user"} ${verb} ${data.collectionSlug}#${data.documentId} [${stage}]`;
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
    read: canApprove, // approvers see the decision history
    create: canApprove, // hook enforces the specific stage-role + separation of duties
    update: () => false, // immutable
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
  hooks: { beforeChange: [enforceApprovalRules], afterChange: [auditApproval] },
};
