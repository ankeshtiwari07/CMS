import type { CollectionConfig } from "payload";
import { allBlocks } from "@humain/blocks";
import { isEditor, canPublish, readPublishedOrEditor } from "../access/roles.js";
import { emitContentEvent, onDelete } from "../hooks/events.js";
import { seoField } from "../fields/seo.js";

export const Pages: CollectionConfig = {
  slug: "pages",
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 50 },
  admin: { useAsTitle: "title", livePreview: { url: ({ data }) => `${process.env.APP_BASE_URL}/preview/${data?.slug}` } },
  access: {
    read: readPublishedOrEditor,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
    readVersions: isEditor,
  },
  fields: [
    { name: "title", type: "text", localized: true, required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "site", type: "relationship", relationTo: "sites" },
    { name: "blocks", type: "blocks", blocks: allBlocks, localized: true },
    seoField(),
  ],
  hooks: { afterChange: [emitContentEvent], afterDelete: [onDelete] },
};
