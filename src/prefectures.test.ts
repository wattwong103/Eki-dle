import { describe, expect, it } from "vitest";
import { adjacentPref, regionOf } from "./prefectures";

describe("adjacentPref", () => {
  it("Tokyo neighbors Kanagawa, Saitama, Chiba, Yamanashi", () => {
    expect(adjacentPref(13, 14)).toBe(true);
    expect(adjacentPref(13, 11)).toBe(true);
    expect(adjacentPref(13, 12)).toBe(true);
    expect(adjacentPref(13, 19)).toBe(true);
    expect(adjacentPref(13, 27)).toBe(false);
  });

  it("Hokkaido neighbors Aomori only", () => {
    expect(adjacentPref(1, 2)).toBe(true);
    expect(adjacentPref(1, 13)).toBe(false);
  });
});

describe("regionOf", () => {
  it("groups prefectures", () => {
    expect(regionOf(13)).toBe("kanto");
    expect(regionOf(27)).toBe("kansai");
    expect(regionOf(1)).toBe("hokkaido");
    expect(regionOf(47)).toBe("kyushu");
  });
});
