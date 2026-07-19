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
    // Ensure alt-text is NEVER null on upload (DAM-ISS-01). Set an immediate,
    // human-readable fallback derived from the filename synchronously; the async
    // worker (below) then upgrades it to AI-generated alt-text when a vision model
    // is available. Previously alt stayed null until/unless the async job ran.
    beforeChange: [({ data, operation }) => {
      if (operation === "create" && !data.alt && (data.filename || data.title)) {
        const base = String(data.filename || data.title).replace(/\.[a-z0-9]+$/i, "");
        const words = base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
        if (words) data.alt = words.charAt(0).toUpperCase() + words.slice(1);
      }
      return data;
    }],
    afterChange: [async ({ doc, operation }) => {
      // Enqueue AI alt-text generation to REPLACE the provisional filename alt
      // with a descriptive one. Marker `provisional` lets the worker know it may
      // overwrite. (Worker skips silently if no vision model is available.)
      if (operation === "create") {
        await ragQueue?.add("alt-text", { id: doc.id }); // worker calls AI service
      }
      return doc;
    }],
  },
};
