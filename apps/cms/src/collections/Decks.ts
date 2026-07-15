import type { Access, CollectionConfig, Where } from "payload";
import { hasRole, isAdmin } from "../access/roles";

// A user's presentation workspace. Decks are AI-generated slide sets (see
// apps/ai-service/src/deck.ts) that users edit in the Deck Studio. Not sensitive
// platform data — any signed-in editor manages their own; admins see all.
const authed: Access = ({ req: { user } }) => Boolean(user);

const ownOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (isAdmin({ req: { user } } as any)) return true;
  if (hasRole(user, ["siteAdmin", "publisher"])) return true;
  return { createdBy: { equals: user.id } } as Where;
};

export const Decks: CollectionConfig = {
  slug: "decks",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "theme", "updatedAt"],
    group: "Create",
    description: "AI-generated presentations built in the Deck Studio.",
  },
  access: {
    read: authed,
    create: authed,
    update: ownOrAdmin,
    delete: ownOrAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === "create" && req.user && !data.createdBy) data.createdBy = req.user.id;
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "subtitle", type: "text" },
    { name: "prompt", type: "textarea", admin: { description: "The original request the deck was generated from." } },
    { name: "theme", type: "text", defaultValue: "midnight", admin: { description: "Theme id (see deck engine THEMES)." } },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: ["draft", "ready", "published"],
    },
    { name: "outline", type: "json", admin: { description: "Approved outline used to generate the deck." } },
    { name: "slides", type: "json", admin: { description: "Full structured slide array." } },
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      admin: { readOnly: true, position: "sidebar" },
    },
  ],
};
