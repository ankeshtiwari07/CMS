import type { CollectionConfig } from "payload";
import { hasRole } from "../access/roles";

// LEAP D4 — immutable content version snapshots for Studio artifacts (pages,
// websites, docs). Every meaningful change captures a snapshot here; the Studio
// Versions tab lists them, restores any one, and downloads it. Append-only:
// snapshots can never be edited, and only admins may prune them.
export const ContentVersions: CollectionConfig = {
  slug: "contentversions",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "artifactKey", "kind", "createdByEmail", "createdAt"],
    group: "Governance",
    description: "Immutable content snapshots (version history) captured from the Studio.",
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: () => false, // immutable — a snapshot is a point-in-time record
    delete: ({ req: { user } }) => hasRole(user, ["admin"]),
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === "create" && req.user && !data.createdByEmail) data.createdByEmail = req.user.email;
        return data;
      },
    ],
  },
  fields: [
    { name: "artifactKey", type: "text", required: true, index: true, admin: { description: "Stable identity of the artifact: <kind>:<slug(title)>." } },
    { name: "kind", type: "text", admin: { description: "html | doc | brand | theme …" } },
    { name: "title", type: "text" },
    { name: "label", type: "text", admin: { description: "autosave | named checkpoint" } },
    { name: "html", type: "textarea", admin: { description: "Snapshot of the HTML artifact (if any)." } },
    { name: "doc", type: "json", admin: { description: "Snapshot of a non-HTML artifact (doc/brand/theme)." } },
    { name: "createdByEmail", type: "text", admin: { readOnly: true } },
  ],
};
