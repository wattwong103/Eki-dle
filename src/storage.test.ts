import { describe, expect, it } from "vitest";
import { defaultLang } from "./storage";

describe("defaultLang", () => {
  it("uses Japanese when the browser language is ja", () => {
    expect(defaultLang("ja")).toBe("ja");
    expect(defaultLang("ja-JP")).toBe("ja");
  });

  it("falls back to English otherwise", () => {
    expect(defaultLang("en-US")).toBe("en");
    expect(defaultLang("th")).toBe("en");
  });
});
