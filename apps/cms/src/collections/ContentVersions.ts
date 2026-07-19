import type { CollectionConfig, Where } from "payload";
import { hasRole, isEditor } from "../access/roles";

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
    // Owner-scoped read: a snapshot is a private draft artifact. Admins see all;
    // everyone else may only read their OWN snapshots (matched by createdByEmail,
    // the owner stamped in beforeChange). Closes the cross-user IDOR (ST-ISS-01)
    // where any authenticated user — including a read-only viewer — could read or
    // list any other user's saved artifact HTML by id or artifactKey.
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (hasRole(user, ["admin"])) return true;
      return { createdByEmail: { equals: user.email } } as Where;
    },
    // Only editors may capture snapshots — a read-only viewer must not be able to
    // persist arbitrary content (ST-ISS-02). Mirrors the Conversations create gate.
    create: isEditor,
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
