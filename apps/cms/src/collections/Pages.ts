import type { CollectionConfig } from "payload";
import { allBlocks } from "@humain/blocks";
import { isEditor, readPublishedOrEditor, editorSiteScoped, editorCreate } from "../access/roles";
import { emitContentEvent, onDelete, enforcePublishPermission, setCreatedBy } from "../hooks/events";
import { seoField } from "../fields/seo";
import { hitlFields } from "./content-types";

export const Pages: CollectionConfig = {
  slug: "pages",
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 50 },
  admin: { useAsTitle: "title", livePreview: { url: ({ data }) => `${process.env.APP_BASE_URL}/preview/${data?.slug}` } },
  access: {
    read: readPublishedOrEditor,
    create: editorCreate,
    update: editorSiteScoped, // ABAC: editors limited to their assigned sites + locale(s)
    delete: editorSiteScoped,
    readVersions: isEditor,
  },
  fields: [
    // Agent-driven drafting inside the admin form (title/slug/SEO); rich block
    // composition happens in the Page Builder (/cms/pages). Same AiAssist agent
    // the content collections use.
    { name: "aiAssist", type: "ui", admin: { components: { Field: "/components/AiAssist#default" } } },
    { name: "title", type: "text", localized: true, required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "site", type: "relationship", relationTo: "sites" },
    { name: "blocks", type: "blocks", blocks: allBlocks, localized: true },
    ...hitlFields,
    seoField(),
  ],
  hooks: { beforeChange: [setCreatedBy, enforcePublishPermission], afterChange: [emitContentEvent], afterDelete: [onDelete] },
};
