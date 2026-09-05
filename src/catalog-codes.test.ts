import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";
import type { GameData } from "./types";
import game from "../public/data/game.json";

describe("catalog codes", () => {
  it("returns known line numbering for 新宿三丁目", () => {
    const catalog = new Catalog(game as unknown as GameData);
    const hit = catalog.search("新宿三丁目", 1)[0];
    expect(hit?.id).toBe(5224);
    const codes = hit ? catalog.codesFor(hit).map((x) => x.code) : [];
    expect(codes).toEqual(expect.arrayContaining(["M09", "F13", "S02"]));
  });
});
