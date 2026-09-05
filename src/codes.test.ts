import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";
import { visibleCodes } from "./codes";
import type { GameData, Line, Station } from "./types";

function line(partial: Partial<Line> & Pick<Line, "id" | "n">): Line {
  return { co: 2, cn: "Op", col: "#000", sk: 0, ...partial };
}

function st(partial: Partial<Station> & Pick<Station, "id" | "n" | "p" | "lat" | "lng" | "l">): Station {
  return { o: "", k: "", r: "", co: [2], f: 1, ct: "", y: 2000, c: [], ...partial };
}

const data: GameData = {
  meta: { source: "t", license: "CC", tag: "t", builtAt: "", stations: 5, lines: 1, puzzle: 1, kana4: 0, kana5: 0, mora4: 0, mora5: 0 },
  lines: [line({ id: 1, n: "L" })],
  stations: [
    st({ id: 1, n: "Target", p: 13, lat: 35, lng: 139, l: [0], co: [2], y: 1990, c: [[0, "T01", 1]] }),
    st({ id: 2, n: "SamePref", p: 13, lat: 35.1, lng: 139.1, l: [0], co: [3], y: 1991, c: [[0, "P11", 1]] }),
    st({ id: 3, n: "SameRegion", p: 14, lat: 35.2, lng: 139.2, l: [0], co: [4], y: 1992, c: [[0, "R21", 1]] }),
    st({ id: 4, n: "SameOp", p: 27, lat: 34.6, lng: 135.5, l: [0], co: [2], y: 1993, c: [[0, "O31", 1]] }),
    st({ id: 5, n: "SameYear", p: 1, lat: 43, lng: 141, l: [0], co: [9], y: 1990, c: [[0, "Y41", 1]] }),
  ],
};

describe("visibleCodes", () => {
  const catalog = new Catalog(data);
  const target = catalog.station(1);

  it("reveals one code initially", () => {
    expect(visibleCodes(catalog, target, 0)).toEqual(["T01"]);
  });

  it("uses fallback order pref->region->operator->year", () => {
    expect(visibleCodes(catalog, target, 4)).toEqual(["T01", "P11", "R21", "O31", "Y41"]);
  });
});
