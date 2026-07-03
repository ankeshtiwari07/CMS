import type { Access, CollectionConfig, Where } from "payload";
import { hasRole, isAdmin } from "../access/roles";

// Component library read: any signed-in editor (and admins) see everything,
// including drafts. Everyone else — including the unauthenticated AI agent that
// pulls the library at page-build time — sees only LIVE components. Components
// are structural building blocks, not sensitive data.
const componentRead: Access = ({ req: { user } }) => {
  if (hasRole(user, ["author", "reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"])) return true;
  return { status: { equals: "live" } } as Where;
};

// The CMS component repository. Per the HUMAIN technical review (Jul 2026), the
// CMS is a repository of reusable building-block components (container / section
// / hero / text / image / …) that ADMINS create and maintain; page creation
// (users + the AI agent) PULLS from this library instead of relying on hardcoded
// page-type skills. Managing components is an admin-only, platform-wide function
// — like globals, siteAdmin is deliberately excluded.
export const Components: CollectionConfig = {
  slug: "components",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "category", "status", "updatedAt"],
    group: "CMS",
    description: "Reusable building blocks. Admins curate them; the AI agent assembles pages from the LIVE ones.",
  },
  access: {
    read: componentRead,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true, admin: { description: "Human name shown in the component library." } },
    {
      name: "key",
      type: "text",
      unique: true,
      index: true,
      admin: { description: "Stable reference id the agent uses to pull this block, e.g. hero-split." },
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "section",
      options: [
        "container", "section", "hero", "text", "image", "gallery", "card",
        "feature", "cta", "testimonial", "stats", "logoCloud", "pricing",
        "faq", "nav", "footer", "form", "banner",
      ],
      admin: { description: "The kind of building block." },
    },
    {
      name: "category",
      type: "select",
      defaultValue: "content",
      options: ["layout", "content", "media", "navigation", "marketing", "form"],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: ["draft", "live"],
      admin: { description: "Only LIVE components are offered to page creation and the AI agent." },
    },
    {
      name: "description",
      type: "textarea",
      admin: { description: "What this block is for — guides the agent on when to use it." },
    },
    {
      name: "html",
      type: "code",
      admin: {
        language: "html",
        description: "The block markup. Use {{slot}} / {{prop}} placeholders the agent fills at build time.",
      },
    },
    {
      name: "props",
      type: "json",
      admin: { description: "Schema of the configurable slots/props (name, label, type, default) the agent populates." },
    },
    { name: "tags", type: "array", fields: [{ name: "value", type: "text" }] },
    { name: "previewImage", type: "upload", relationTo: "media" },
  ],
  timestamps: true,
};
