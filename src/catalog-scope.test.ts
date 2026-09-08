import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";
import type { GameData, Station } from "./types";

function stubStation(partial: Partial<Station> & { id: number }): Station {
  return {
    n: "x",
    o: "x",
    k: "あいうえお",
    r: "x",
    p: 13,
    ct: "千代田区",
    y: 1,
    lat: 35.68,
    lng: 139.76,
    l: [],
    co: [1],
    f: 1,
    ...partial,
  };
}

describe("Catalog.idsInScope", () => {
  const data: GameData = {
    meta: {
      source: "t",
      license: "t",
      tag: "t",
      builtAt: "t",
      stations: 2,
      lines: 0,
      puzzle: 2,
      kana4: 0,
      kana5: 0,
      mora4: 0,
      mora5: 0,
    },
    lines: [],
    stations: [
      stubStation({ id: 1, p: 13, f: 1, l: [0, 1], c: [[0, "T01", 1]] }),
      stubStation({ id: 2, p: 27, ct: "大阪市", lat: 34.7, lng: 135.5, f: 1 }),
      stubStation({ id: 3, p: 1, ct: "札幌市", lat: 43.06, lng: 141.35, f: 3 }),
      stubStation({ id: 4, p: 13, f: 0, l: [0, 1], n: "local", o: "local", c: [[0, "M01", 1]] }),
      stubStation({ id: 5, p: 13, ct: "八王子市", f: 1, n: "八王子", o: "八王子" }),
    ],
  };
  const catalog = new Catalog(data);

  it("filters ids by region scope", () => {
    expect(catalog.idsInScope([1, 2, 3], "kanto")).toEqual([1]);
    expect(catalog.idsInScope([1, 2, 3], "kansai")).toEqual([2]);
  });

  it("returns all ids for all scope", () => {
    expect(catalog.idsInScope([1, 2, 3], "all")).toEqual([1, 2, 3]);
  });

  it("filters shinkansen flag", () => {
    expect(catalog.idsInScope([1, 2, 3], "shinkansen")).toEqual([3]);
  });

  it("puzzleIdsFor does not fall back nationwide when a city is empty", () => {
    expect(catalog.puzzleIdsFor("naha")).toEqual([]);
    expect(catalog.puzzleIdsFor("osaka")).toEqual([2]);
  });

  it("city dailies use transfer-quality stations only; Tokyo excludes Tama", () => {
    expect(catalog.puzzleIdsFor("tokyo")).toEqual([1]);
    expect(catalog.practiceIdsFor("tokyo")).toEqual(expect.arrayContaining([1, 4]));
    expect(catalog.practiceIdsFor("tokyo")).not.toContain(5);
    expect(catalog.puzzleIdsFor("tokyo")).not.toContain(5);
  });

  it("codeIdsFor uses numbered transfers outside cities, all numbered inside a city", () => {
    expect(catalog.codeIdsFor("kanto")).toEqual([1]);
    expect(catalog.codeIdsFor("tokyo")).toEqual(expect.arrayContaining([1, 4]));
    expect(catalog.codeIdsFor("tokyo")).not.toContain(5);
  });

  it("diagramIds includes 2+ line stations and puzzle-flagged stops", () => {
    expect(catalog.diagramIds).toEqual(expect.arrayContaining([1, 2, 3, 4]));
    expect(catalog.idsInScope(catalog.diagramIds, "sapporo")).toEqual([3]);
    expect(catalog.idsInScope(catalog.diagramIds, "kanto")).toEqual(expect.arrayContaining([1, 4]));
  });
});
