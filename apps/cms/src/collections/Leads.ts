import type { CollectionConfig } from "payload";
import { hasRole } from "../access/roles";

// Leads captured from generated landing-page forms. Create is PUBLIC (a visitor
// on a served /site/<slug> page submits the form); read is staff-only.
export const Leads: CollectionConfig = {
  slug: "leads",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "siteSlug", "createdAt"],
    group: "Governance",
    description: "Leads captured from generated landing-page contact forms.",
  },
  access: {
    create: () => true, // public form submissions
    read: ({ req: { user } }) => hasRole(user, ["admin", "siteAdmin", "publisher", "reviewer", "author", "brand", "compliance"]),
    update: () => false, // immutable
    delete: ({ req: { user } }) => hasRole(user, ["admin", "siteAdmin"]),
  },
  fields: [
    { name: "siteSlug", type: "text", index: true, admin: { description: "The /site/<slug> page this lead came from." } },
    { name: "name", type: "text" },
    { name: "email", type: "text", index: true },
    { name: "message", type: "textarea" },
  ],
};
