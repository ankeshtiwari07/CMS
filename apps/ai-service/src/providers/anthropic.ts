import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider, CompleteRequest } from "./types.js";

// Pinned provider: Anthropic Claude for completion, Voyage for embeddings.
export class AnthropicProvider implements LlmProvider {
  name = "anthropic";
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async complete(req: CompleteRequest): Promise<string> {
    const model = req.fast
      ? (process.env.ANTHROPIC_FAST_MODEL as string)
      : (process.env.ANTHROPIC_MODEL as string);
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
    // Voyage AI (Anthropic-recommended embeddings)
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: process.env.VOYAGE_EMBED_MODEL || "voyage-3", input: texts }),
    });
    if (!res.ok) throw new Error(`Voyage error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { data: { embedding: number[] }[] };
    return data.data.map((d) => d.embedding);
  }
}
