import { describe, expect, it } from "vitest";
import { parseCropsManifest, fallbackDiagramSvg } from "./crops";

describe("crops manifest", () => {
  it("parses valid entries and skips invalid rows", () => {
    const parsed = parseCropsManifest({
      crops: [
        { id: 1, file: "tokyo.png", hub: "Tokyo" },
        { id: "x", file: "bad.png", hub: "Bad" },
      ],
    });
    expect(parsed).toEqual([{ id: 1, file: "tokyo.png", hub: "Tokyo", license: undefined }]);
  });

  it("builds svg fallback data url", () => {
    const url = fallbackDiagramSvg("Tokyo");
    expect(url.startsWith("data:image/svg+xml")).toBe(true);
  });
});
