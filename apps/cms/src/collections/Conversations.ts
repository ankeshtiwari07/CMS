import type { CollectionConfig } from "payload";
import { isEditor, ownScoped } from "../access/roles";

// Per-user Create Studio chat history. Each row is one "topic" (a conversation
// thread) owned by the user who started it. PRIVATE per user — owner-scoped
// read/update/delete (admins/compliance see all for audit). The full turn list
// is stored as JSON so a thread can be reopened with all its messages + inline
// artifacts intact. `title` is the topic name (auto-derived, user-renamable).
export const Conversations: CollectionConfig = {
  slug: "conversations",
  admin: { useAsTitle: "title", defaultColumns: ["title", "owner", "updatedAt"] },
  access: { read: ownScoped, create: isEditor, update: ownScoped, delete: ownScoped },
  hooks: {
    // Owner is always the authenticated user — never trust a client-supplied owner.
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === "create" && req.user) data.owner = req.user.id;
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true, admin: { description: "Topic name — auto-derived from the first message, renamable." } },
    { name: "messages", type: "json", admin: { description: "Ordered turns: [{ role, text, mode, model, ...artifacts }]." } },
    { name: "mode", type: "text", admin: { description: "Primary mode of the conversation (auto/writing/website/…)." } },
    { name: "projectId", type: "text", admin: { description: "Project this discussion persists into — one project per discussion; lets a saved chat re-open in context." } },
    { name: "model", type: "text" },
    { name: "summary", type: "textarea", admin: { description: "Rolling summary of older turns for context compaction (optional)." } },
    { name: "pinned", type: "checkbox", defaultValue: false },
    { name: "archived", type: "checkbox", defaultValue: false },
    { name: "owner", type: "relationship", relationTo: "users" },
  ],
};
