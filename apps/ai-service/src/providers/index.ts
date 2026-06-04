import type { LlmProvider } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";

export function getProvider(): LlmProvider {
  switch (process.env.LLM_PROVIDER || "anthropic") {
    case "anthropic": return new AnthropicProvider();
    default: return new AnthropicProvider();
  }
}
