import type { Field } from "payload";

export const seoField = (): Field => ({
  name: "seo",
  type: "group",
  fields: [
    { name: "metaTitle", type: "text", localized: true, maxLength: 60 },
    { name: "metaDescription", type: "textarea", localized: true, maxLength: 160 },
    { name: "ogImage", type: "upload", relationTo: "media" },
    { name: "canonical", type: "text" },
    { name: "jsonLd", type: "json" },
    { name: "noindex", type: "checkbox", defaultValue: false },
  ],
});
