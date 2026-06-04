import { z } from "zod";

export interface CompleteRequest {
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  fast?: boolean;
}
export interface LlmProvider {
  name: string;
  complete(req: CompleteRequest): Promise<string>;
  embed(texts: string[]): Promise<number[][]>;
}

// Validate structured JSON output against a Zod schema.
export function parseStructured<T>(raw: string, schema: z.ZodType<T>): T {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const json = JSON.parse(cleaned);
  return schema.parse(json);
}
