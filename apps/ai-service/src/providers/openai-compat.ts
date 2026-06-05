import type { LlmProvider, CompleteRequest } from "./types.js";
import { embedTexts } from "./embeddings.js";

// One provider class for every OpenAI-compatible chat-completions API.
// OpenAI, xAI (Grok) and Google Gemini all expose this shape, so we just vary
// the base URL, the API-key env var, and the default model. Embeddings stay
// local (sovereign) regardless of the chat provider.
export type CompatConfig = {
  name: string;
  baseUrl: string; // up to and including /v1 (no trailing slash)
  apiKeyEnv: string;
  defaultModel: string;
  tokenParam?: "max_tokens" | "max_completion_tokens";
};

export class OpenAICompatProvider implements LlmProvider {
  constructor(private cfg: CompatConfig) {}

  get name() {
    return this.cfg.name;
  }

  get configured(): boolean {
    return Boolean(process.env[this.cfg.apiKeyEnv]);
  }

  async complete(req: CompleteRequest): Promise<string> {
    const key = process.env[this.cfg.apiKeyEnv];
    if (!key) throw new Error(`${this.cfg.name} is not configured (set ${this.cfg.apiKeyEnv}).`);

    const messages = [
      ...(req.system ? [{ role: "system", content: req.system }] : []),
      ...req.messages,
    ];
    const body: Record<string, unknown> = {
      model: req.model || this.cfg.defaultModel,
      messages,
    };
    body[this.cfg.tokenParam || "max_tokens"] = req.maxTokens ?? 1024;

    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = text;
      try {
        msg = JSON.parse(text)?.error?.message || text;
      } catch {
        /* keep raw */
      }
      throw new Error(`${this.cfg.name} error ${res.status}: ${msg}`.slice(0, 400));
    }
    const data = (await res.json()) as any;
    return data?.choices?.[0]?.message?.content ?? "";
  }

  async embed(texts: string[]): Promise<number[][]> {
    return embedTexts(texts);
  }
}
