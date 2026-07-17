import type { LlmProvider, CompleteRequest, ChatWithToolsRequest, ChatWithToolsResult } from "./types.js";
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
  extraBody?: Record<string, unknown>;
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
    if (this.cfg.extraBody) Object.assign(body, this.cfg.extraBody);

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
    const content = data?.choices?.[0]?.message?.content ?? "";
    // Reasoning models (e.g. MiniMax-M2) wrap chain-of-thought in <think>...</think>;
    // strip it so only the final answer reaches the app.
    return String(content).replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  }

  // Real token streaming. Calls onDelta(text) per chunk (with <think>…</think>
  // stripped incrementally) and returns the full accumulated text.
  async completeStream(req: CompleteRequest, onDelta: (t: string) => void): Promise<string> {
    const key = process.env[this.cfg.apiKeyEnv];
    if (!key) throw new Error(`${this.cfg.name} is not configured (set ${this.cfg.apiKeyEnv}).`);
    const messages = [...(req.system ? [{ role: "system", content: req.system }] : []), ...req.messages];
    const body: Record<string, unknown> = { model: req.model || this.cfg.defaultModel, messages, stream: true };
    body[this.cfg.tokenParam || "max_tokens"] = req.maxTokens ?? 1024;
    if (this.cfg.extraBody) Object.assign(body, this.cfg.extraBody);
    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`${this.cfg.name} error ${res.status}: ${text}`.slice(0, 400));
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "", full = "", inThink = false;
    const emit = (piece: string) => {
      let s = piece;
      while (s) {
        if (inThink) { const end = s.indexOf("</think>"); if (end === -1) return; s = s.slice(end + 8); inThink = false; continue; }
        const start = s.indexOf("<think>");
        if (start === -1) { full += s; onDelta(s); return; }
        const before = s.slice(0, start); if (before) { full += before; onDelta(before); }
        s = s.slice(start + 7); inThink = true;
      }
    };
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return full.trim();
        try { const d = JSON.parse(payload)?.choices?.[0]?.delta?.content; if (typeof d === "string" && d) emit(d); } catch { /* partial */ }
      }
    }
    return full.trim();
  }

  // Agentic tool-use turn (OpenAI function-calling). Returns any tool calls the
  // model wants to make plus the raw assistant message to append for the next turn.
  async chatWithTools(req: ChatWithToolsRequest): Promise<ChatWithToolsResult> {
    const key = process.env[this.cfg.apiKeyEnv];
    if (!key) throw new Error(`${this.cfg.name} is not configured (set ${this.cfg.apiKeyEnv}).`);
    const messages = [...(req.system ? [{ role: "system", content: req.system }] : []), ...req.messages];
    const body: Record<string, unknown> = {
      model: req.model || this.cfg.defaultModel,
      messages,
      tools: req.tools,
      tool_choice: "auto",
    };
    body[this.cfg.tokenParam || "max_tokens"] = req.maxTokens ?? 2048;
    if (this.cfg.extraBody) Object.assign(body, this.cfg.extraBody);

    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = text;
      try { msg = JSON.parse(text)?.error?.message || text; } catch { /* keep raw */ }
      throw new Error(`${this.cfg.name} error ${res.status}: ${msg}`.slice(0, 400));
    }
    const data = (await res.json()) as any;
    const m = data?.choices?.[0]?.message ?? {};
    const content = String(m.content || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    const toolCalls = Array.isArray(m.tool_calls)
      ? m.tool_calls.map((t: any) => {
          let args: any = {};
          try { args = JSON.parse(t.function?.arguments || "{}"); } catch { /* leave {} */ }
          return { id: t.id, name: t.function?.name, args };
        })
      : [];
    return { content, toolCalls, assistant: m };
  }

  async embed(texts: string[]): Promise<number[][]> {
    return embedTexts(texts);
  }
}
