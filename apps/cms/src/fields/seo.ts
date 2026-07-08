import type { Field } from "payload";

export const seoField = (): Field => ({
  name: "seo",
  type: "group",
  fields: [
    { name: "metaTitle", type: "text", localized: true, maxLength: 60 },
    { name: "metaDescription", type: "textarea", localized: true, maxLength: 160 },
    { name: "ogImage", type: "upload", relationTo: "media" },
    { name: "canonical", type: "text" },
    {
      name: "jsonLd",
      type: "json",
      // Themed, self-contained editor — Payload's default json field loads
      // Monaco from a CDN the admin CSP blocks (it rendered as an empty grey
      // box). See src/fields/JsonLdField.tsx.
      admin: { components: { Field: "/fields/JsonLdField#default" } },
    },
    { name: "noindex", type: "checkbox", defaultValue: false },
  ],
});
