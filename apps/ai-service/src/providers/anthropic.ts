import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider, CompleteRequest } from "./types.js";
import { embedTexts } from "./embeddings.js";

// Claude for completion (the only AI generation provider); embeddings run locally.
export class AnthropicProvider implements LlmProvider {
  name = "anthropic";
  // Fail fast when the key is dead/unavailable instead of burning the SDK's
  // default 2 exponential-backoff retries before every fallback (the retry tax
  // dominated the ~82s website build). Env-overridable.
  private client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "missing",
    maxRetries: Number(process.env.ANTHROPIC_MAX_RETRIES ?? 0),
    timeout: Number(process.env.ANTHROPIC_TIMEOUT_MS ?? 30000),
  });

  get configured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  async complete(req: CompleteRequest): Promise<string> {
    const model =
      req.model ||
      (req.fast
        ? process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-4-5-20251001"
        : process.env.ANTHROPIC_MODEL || "claude-opus-4-8");
    const res = await this.client.messages.create({
      model,
      max_tokens: req.maxTokens ?? 1024,
      system: req.system,
      messages: req.messages,
    });
    return res.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");
  }

  async embed(texts: string[]): Promise<number[][]> {
    return embedTexts(texts);
  }
}
