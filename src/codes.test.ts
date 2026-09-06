import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";
import { visibleCodes } from "./codes";
import type { GameData, Line, Station } from "./types";

function line(partial: Partial<Line> & Pick<Line, "id" | "n">): Line {
  return { r: "", ce: "", co: 2, cn: "Op", col: "#000", sk: 0, ...partial };
}

function st(partial: Partial<Station> & Pick<Station, "id" | "n" | "p" | "lat" | "lng" | "l">): Station {
  return { o: "", k: "", r: "", co: [2], f: 1, ct: "", y: 2000, c: [], ...partial };
}

const data: GameData = {
  meta: {
    source: "t",
    license: "CC",
    tag: "t",
    builtAt: "",
    stations: 5,
    lines: 3,
    puzzle: 1,
    kana4: 0,
    kana5: 0,
    mora4: 0,
    mora5: 0,
  },
  lines: [
    line({ id: 1, n: "L1", cn: "Metro", col: "#e11" }),
    line({ id: 2, n: "L2", cn: "Metro", col: "#11e" }),
    line({ id: 3, n: "L3", cn: "Private", col: "#1e1" }),
  ],
  stations: [
    st({
      id: 1,
      n: "Target",
      p: 13,
      lat: 35,
      lng: 139,
      l: [0, 1],
      co: [2],
      y: 1990,
      c: [
        [0, "T01", 1],
        [1, "T02", 2],
      ],
    }),
    st({ id: 2, n: "SamePref", p: 13, lat: 35.1, lng: 139.1, l: [0], co: [3], y: 1991, c: [[0, "P11", 1]] }),
    st({ id: 3, n: "SameRegion", p: 14, lat: 35.2, lng: 139.2, l: [0], co: [4], y: 1992, c: [[0, "R21", 1]] }),
    st({ id: 4, n: "SameOp", p: 27, lat: 34.6, lng: 135.5, l: [0], co: [2], y: 1993, c: [[0, "O31", 1]] }),
    st({ id: 5, n: "SameYear", p: 1, lat: 43, lng: 141, l: [0], co: [9], y: 1990, c: [[0, "Y41", 1]] }),
  ],
};

describe("visibleCodes", () => {
  const catalog = new Catalog(data);
  const target = catalog.station(1);

  it("reveals one of the target's own codes initially", () => {
    expect(visibleCodes(catalog, target, 0)).toEqual([
      { kind: "code", code: "T01", color: "#e11" },
    ]);
  });

  it("reveals more of the target's own codes as misses grow", () => {
    expect(visibleCodes(catalog, target, 1)).toEqual([
      { kind: "code", code: "T01", color: "#e11" },
      { kind: "code", code: "T02", color: "#11e" },
    ]);
  });

  it("fills with target text hints (pref→region→operator→year), never other stations' codes", () => {
    const shown = visibleCodes(catalog, target, 5, "en");
    expect(shown.map((x) => (x.kind === "code" ? x.code : x.label))).toEqual([
      "T01",
      "T02",
      "Tokyo",
      "Kanto",
      "Metro",
      "1990",
    ]);
    expect(shown.every((x) => x.kind === "code" || x.kind === "hint")).toBe(true);
    expect(shown.some((x) => x.kind === "code" && ["P11", "R21", "O31", "Y41"].includes(x.code))).toBe(
      false,
    );
  });

  it("uses Japanese labels when lang is ja", () => {
    const shown = visibleCodes(catalog, target, 3, "ja");
    expect(shown[2]).toEqual({ kind: "hint", label: "東京都" });
    expect(shown[3]).toEqual({ kind: "hint", label: "関東" });
  });
});
