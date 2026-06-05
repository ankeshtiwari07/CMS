import type { CollectionConfig } from "payload";
import { isEditor } from "../access/roles";

// Brand guidelines: curated archetypes (isArchetype=true, seeded) the system
// suggests, plus user-composed guidelines. The full structure (sections,
// palette, typography) lives in `data` (json) for flexibility; top-level
// fields are for listing/filtering.
export const BrandGuidelines: CollectionConfig = {
  slug: "brandGuidelines",
  admin: { useAsTitle: "name", group: "Studio" },
  access: { read: isEditor, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "industry", type: "text" },
    { name: "summary", type: "textarea" },
    { name: "isArchetype", type: "checkbox", defaultValue: false,
      admin: { description: "System suggestion shown to everyone in the library." } },
    { name: "source", type: "select", defaultValue: "custom",
      options: ["humain", "archetype", "ai", "custom"] },
    // { sections: [{ id, type, title, content, meta }], palette: [...], typography: {...} }
    { name: "data", type: "json" },
    { name: "owner", type: "relationship", relationTo: "users" },
  ],
};
