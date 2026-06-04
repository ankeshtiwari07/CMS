// Reusable, versioned block schemas shared by CMS (authoring) and web (rendering).
// Each block has a stable `blockType` contract consumed by @humain/ui renderers.
import type { Block } from "payload";

export const HeroBlock: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
  fields: [
    { name: "heading", type: "text", localized: true, required: true },
    { name: "subheading", type: "text", localized: true },
    { name: "media", type: "upload", relationTo: "media" },
    { name: "cta", type: "group", fields: [
      { name: "label", type: "text", localized: true },
      { name: "href", type: "text" },
    ] },
    { name: "theme", type: "select", defaultValue: "studio",
      options: ["studio", "cms", "neutral"] },
  ],
};

export const RichTextBlock: Block = {
  slug: "richText",
  interfaceName: "RichTextBlock",
  fields: [{ name: "content", type: "richText", localized: true, required: true }],
};

export const MediaBlock: Block = {
  slug: "media",
  interfaceName: "MediaBlock",
  fields: [
    { name: "media", type: "upload", relationTo: "media", required: true },
    { name: "caption", type: "text", localized: true },
  ],
};

export const CtaBlock: Block = {
  slug: "cta",
  interfaceName: "CtaBlock",
  fields: [
    { name: "heading", type: "text", localized: true },
    { name: "buttons", type: "array", fields: [
      { name: "label", type: "text", localized: true },
      { name: "href", type: "text" },
      { name: "style", type: "select", defaultValue: "primary", options: ["primary", "secondary"] },
    ] },
  ],
};

export const CardsBlock: Block = {
  slug: "cards",
  interfaceName: "CardsBlock",
  fields: [
    { name: "title", type: "text", localized: true },
    { name: "cards", type: "array", fields: [
      { name: "title", type: "text", localized: true, required: true },
      { name: "body", type: "textarea", localized: true },
      { name: "icon", type: "text" },
      { name: "href", type: "text" },
    ] },
  ],
};

export const FaqBlock: Block = {
  slug: "faqBlock",
  interfaceName: "FaqBlock",
  fields: [
    { name: "title", type: "text", localized: true },
    { name: "items", type: "array", fields: [
      { name: "question", type: "text", localized: true, required: true },
      { name: "answer", type: "richText", localized: true, required: true },
    ] },
  ],
};

export const StatsBlock: Block = {
  slug: "stats",
  interfaceName: "StatsBlock",
  fields: [{ name: "stats", type: "array", fields: [
    { name: "value", type: "text", required: true },
    { name: "label", type: "text", localized: true, required: true },
  ] }],
};

export const QuoteBlock: Block = {
  slug: "quote",
  interfaceName: "QuoteBlock",
  fields: [
    { name: "quote", type: "textarea", localized: true, required: true },
    { name: "attribution", type: "text", localized: true },
  ],
};

export const GalleryBlock: Block = {
  slug: "gallery",
  interfaceName: "GalleryBlock",
  fields: [{ name: "items", type: "array", fields: [
    { name: "media", type: "upload", relationTo: "media", required: true },
    { name: "caption", type: "text", localized: true },
  ] }],
};

export const EmbedBlock: Block = {
  slug: "embed",
  interfaceName: "EmbedBlock",
  fields: [
    { name: "provider", type: "select", options: ["youtube", "vimeo", "iframe"], required: true },
    { name: "url", type: "text", required: true },
  ],
};

export const allBlocks: Block[] = [
  HeroBlock, RichTextBlock, MediaBlock, CtaBlock, CardsBlock,
  FaqBlock, StatsBlock, QuoteBlock, GalleryBlock, EmbedBlock,
];
