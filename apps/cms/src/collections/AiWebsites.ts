import type { Access, CollectionConfig, Where } from "payload";
import { hasRole, isAdmin } from "../access/roles";
import { enforcePublishOnField, emitContentEvent, onDelete } from "../hooks/events";

// AI-generated marketing websites (see apps/ai-service/src/website.ts). Built in
// the Website Studio, stored here, and served at /site/<slug> by the web app.
// Published sites are publicly readable so the (unauthenticated) web app can render them.
const readAccess: Access = ({ req: { user } }) => {
  if (hasRole(user, ["author", "reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"])) return true;
  return { status: { equals: "published" } } as Where;
};
const ownOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (isAdmin({ req: { user } } as any)) return true;
  if (hasRole(user, ["siteAdmin", "publisher"])) return true;
  return { createdBy: { equals: user.id } } as Where;
};

export const AiWebsites: CollectionConfig = {
  slug: "aiwebsites",
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug", "status", "updatedAt"], group: "Create", description: "AI-generated websites built in the Website Studio. Publishing routes through the approval flow (Flow A)." },
  access: { read: readAccess, create: ({ req: { user } }) => Boolean(user), update: ownOrAdmin, delete: ownOrAdmin },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === "create" && req.user && !data.createdBy) data.createdBy = req.user.id;
        // AI websites are agent-generated → force at least an editorial review.
        if (operation === "create" && data.aiGenerated == null) data.aiGenerated = true;
        return data;
      },
      // Publishing an AI website (status → published) requires a publish role AND
      // cleared HITL approval — agents propose, authorised humans dispose (Flow A).
      enforcePublishOnField("status", "published"),
    ],
    afterChange: [emitContentEvent],
    afterDelete: [onDelete],
  },
  fields: [
    // Agent-driven creation (option b): describe the site, the agent builds it and
    // fills every field below. See src/components/AiSiteAssist.tsx.
    { name: "siteAssist", type: "ui", admin: { components: { Field: "/components/AiSiteAssist#default" } } },
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, index: true, admin: { description: "Public path: /site/<slug>" } },
    { name: "prompt", type: "textarea" },
    { name: "contentType", type: "text", defaultValue: "website", admin: { description: "What this artefact is — website | page | blog | post." } },
    { name: "status", type: "select", defaultValue: "draft", options: ["draft", "in-review", "published"] },
    { name: "brand", type: "json" },
    { name: "sections", type: "json", admin: { description: "Ordered library-composed blocks (component instances: kind + componentKey + html)." } },
    { name: "html", type: "textarea", admin: { description: "Full assembled standalone HTML document." } },
    { name: "createdBy", type: "relationship", relationTo: "users", admin: { readOnly: true, position: "sidebar" } },
    // ---- Governance / approval (Flow A) ----
    { name: "aiGenerated", type: "checkbox", defaultValue: true, admin: { position: "sidebar", description: "AI-built — forces editorial review before publish." } },
    { name: "riskTier", type: "text", defaultValue: "low", admin: { position: "sidebar", description: "Approval depth: trivial | low | medium | high." } },
  ],
};
