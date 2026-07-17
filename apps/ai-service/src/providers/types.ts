import { z } from "zod";

export interface CompleteRequest {
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  fast?: boolean;
  model?: string; // explicit provider model id (overrides fast/default)
}
// Agentic tool-use (OpenAI function-calling shape). Lets the orchestrator run
// its tool-use loop on any OpenAI-compatible provider (MiniMax, HUMAIN gateway,
// GPT, Grok, Gemini) — not just Claude.
export type ToolCall = { id: string; name: string; args: any };
export interface ChatWithToolsRequest {
  system?: string;
  messages: any[]; // OpenAI-format message list (user/assistant/tool)
  tools: any[]; // OpenAI tools: [{type:"function", function:{name,description,parameters}}]
  maxTokens?: number;
  model?: string;
}
export interface ChatWithToolsResult {
  content: string;
  toolCalls: ToolCall[];
  assistant: any; // raw assistant message (with tool_calls) to append for the next turn
}

export interface LlmProvider {
  name: string;
  configured?: boolean;
  complete(req: CompleteRequest): Promise<string>;
  completeStream?(req: CompleteRequest, onDelta: (t: string) => void): Promise<string>;
  embed(texts: string[]): Promise<number[][]>;
  // Optional: providers that support function-calling implement this so the
  // agent's tool-use loop can run on them (see OpenAICompatProvider).
  chatWithTools?(req: ChatWithToolsRequest): Promise<ChatWithToolsResult>;
}

// Validate structured JSON output against a Zod schema.
export function parseStructured<T>(raw: string, schema: z.ZodType<T>): T {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const json = JSON.parse(cleaned);
  return schema.parse(json);
}
