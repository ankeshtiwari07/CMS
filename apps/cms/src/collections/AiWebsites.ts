import type { Access, CollectionConfig, Where } from "payload";
import { hasRole, isAdmin } from "../access/roles";

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
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug", "status", "updatedAt"], group: "Create", description: "AI-generated websites built in the Website Studio." },
  access: { read: readAccess, create: ({ req: { user } }) => Boolean(user), update: ownOrAdmin, delete: ownOrAdmin },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === "create" && req.user && !data.createdBy) data.createdBy = req.user.id;
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, index: true, admin: { description: "Public path: /site/<slug>" } },
    { name: "prompt", type: "textarea" },
    { name: "status", type: "select", defaultValue: "draft", options: ["draft", "published"] },
    { name: "brand", type: "json" },
    { name: "sections", type: "json", admin: { description: "Ordered generated sections (kind + html)." } },
    { name: "html", type: "textarea", admin: { description: "Full assembled standalone HTML document." } },
    { name: "createdBy", type: "relationship", relationTo: "users", admin: { readOnly: true, position: "sidebar" } },
  ],
};
