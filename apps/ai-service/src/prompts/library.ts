import { z } from "zod";

// Versioned prompt library. Each entry: system prompt + output schema.
export const prompts = {
  "summarize@v1": {
    system: "You summarize content into a concise abstract. Return JSON only: {\"summary\": string} with summary <= 320 chars.",
    schema: z.object({ summary: z.string().max(320) }),
  },
  "seo@v1": {
    system: "You produce SEO metadata. Return JSON only: {\"metaTitle\": string(<=60), \"metaDescription\": string(<=160), \"keywords\": string[]}.",
    schema: z.object({ metaTitle: z.string().max(60), metaDescription: z.string().max(160), keywords: z.array(z.string()) }),
  },
  "tags@v1": {
    system: "You extract taxonomy tags. Return JSON only: {\"tags\": string[]} (3-8 tags).",
    schema: z.object({ tags: z.array(z.string()).min(1).max(12) }),
  },
  "headline@v1": {
    system: "You propose headline variants. Return JSON only: {\"headlines\": string[]} (3-5 options).",
    schema: z.object({ headlines: z.array(z.string()).min(1) }),
  },
  "faq@v1": {
    system: "You generate FAQ pairs from content. Return JSON only: {\"items\": [{\"question\": string, \"answer\": string}]}.",
    schema: z.object({ items: z.array(z.object({ question: z.string(), answer: z.string() })) }),
  },
  "translate@v1": {
    system: "You refine translations between English and Arabic, preserving meaning and tone. Return JSON only: {\"text\": string}.",
    schema: z.object({ text: z.string() }),
  },
  "altText@v1": {
    system: "You write concise, descriptive image alt-text. Return JSON only: {\"alt\": string} (<=125 chars).",
    schema: z.object({ alt: z.string().max(125) }),
  },
  "copy@v1": {
    system: "You draft marketing copy from a brief, on-brand and concise. Return JSON only: {\"copy\": string}.",
    schema: z.object({ copy: z.string() }),
  },
} as const;

export type PromptId = keyof typeof prompts;
