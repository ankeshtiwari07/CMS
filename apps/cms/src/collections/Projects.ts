import type { CollectionConfig } from "payload";
import { isEditor, ownScoped } from "../access/roles";

// Create Studio output: typed project assets that can be promoted into CMS collections.
// Projects are PRIVATE per user — owner-scoped read/update/delete (admins see all).
export const Projects: CollectionConfig = {
  slug: "projects",
  admin: { useAsTitle: "title" },
  access: { read: ownScoped, create: isEditor, update: ownScoped, delete: ownScoped },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "type", type: "select", required: true,
      options: ["deck", "image", "website", "email", "brand", "designSystem", "writing", "translation",
        "event", "webinar", "campaign", "brandGuideline", "websiteBuild", "video", "conference", "summit"] },
    { name: "prompt", type: "textarea" },
    { name: "model", type: "text" },
    { name: "options", type: "json" },
    { name: "asset", type: "json", admin: { description: "Generated artifact payload or asset refs." } },
    { name: "media", type: "relationship", relationTo: "media", hasMany: true },
    { name: "status", type: "select", defaultValue: "draft", options: ["draft", "ready", "promoted"] },
    { name: "promotedTo", type: "json", admin: { description: "{ collection, id } once sent to CMS." } },
    { name: "owner", type: "relationship", relationTo: "users" },
  ],
};
