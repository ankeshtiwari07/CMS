import { describe, it, expect } from "vitest";
import { parseStructured } from "../src/providers/types.js";
import { prompts } from "../src/prompts/library.js";

describe("AI output validation", () => {
  it("accepts valid summary JSON", () => {
    const out = parseStructured('{"summary":"short"}', prompts["summarize@v1"].schema);
    expect(out.summary).toBe("short");
  });
  it("rejects summary over max length", () => {
    const long = "x".repeat(400);
    expect(() => parseStructured(`{"summary":"${long}"}`, prompts["summarize@v1"].schema)).toThrow();
  });
  it("rejects malformed JSON", () => {
    expect(() => parseStructured("not json", prompts["seo@v1"].schema)).toThrow();
  });
});
