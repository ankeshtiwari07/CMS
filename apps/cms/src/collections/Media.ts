import type { CollectionConfig } from "payload";
import { isEditor, readPublishedOrEditor } from "../access/roles";
import { ragQueue } from "../hooks/events";

export const Media: CollectionConfig = {
  slug: "media",
  access: { read: () => true, create: isEditor, update: isEditor, delete: isEditor },
  upload: {
    // Storage handled by @payloadcms/storage-s3 adapter (KSA S3-compatible)
    imageSizes: [
      { name: "thumbnail", width: 400 },
      { name: "card", width: 768 },
      { name: "hero", width: 1600 },
    ],
    mimeTypes: ["image/*", "video/*", "application/pdf"],
  },
  fields: [
    { name: "alt", type: "text", localized: true,
      admin: { description: "AI alt-text suggested on upload; human-approved." } },
    { name: "usageRights", type: "text" },
    { name: "aiGenerated", type: "checkbox", defaultValue: false },
  ],
  hooks: {
    afterChange: [async ({ doc, operation }) => {
      if (operation === "create" && !doc.alt) {
        await ragQueue?.add("alt-text", { id: doc.id }); // worker calls AI service
      }
      return doc;
    }],
  },
};
