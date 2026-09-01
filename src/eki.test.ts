import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";
import { evaluateEki } from "./eki";
import type { GameData, Station } from "./types";

function st(partial: Partial<Station> & Pick<Station, "id" | "n" | "k" | "r" | "p" | "lat" | "lng">): Station {
  return {
    o: "",
    l: [0],
    co: [2],
    f: 1,
    ct: "",
    y: 0,
    ...partial,
  };
}

const tokyo = st({
  id: 1,
  n: "東京",
  k: "とうきょう",
  r: "Tokyo",
  p: 13,
  ct: "千代田区",
  lat: 35.681391,
  lng: 139.766103,
  l: [0, 1],
  co: [2, 3],
});
const shinjuku = st({
  id: 2,
  n: "新宿",
  k: "しんじゅく",
  r: "Shinjuku",
  p: 13,
  ct: "新宿区",
  lat: 35.690189,
  lng: 139.700399,
  l: [0, 2],
  co: [2],
});
const sapporo = st({
  id: 3,
  n: "札幌",
  k: "さっぽろ",
  r: "Sapporo",
  p: 1,
  lat: 43.068612,
  lng: 141.350768,
});
const hakata = st({
  id: 4,
  n: "博多",
  k: "はかた",
  r: "Hakata",
  p: 40,
  lat: 33.589726,
  lng: 130.420681,
});

const data: GameData = {
  meta: {
    source: "test",
    license: "CC BY 4.0",
    tag: "test",
    builtAt: "",
    stations: 4,
    lines: 3,
    puzzle: 4,
    kana4: 0,
    kana5: 2,
    mora4: 0,
    mora5: 0,
  },
  lines: [
    { id: 1, n: "JR山手線", co: 2, cn: "JR東日本", col: "", sk: 0 },
    { id: 2, n: "東海道新幹線", co: 3, cn: "JR東海", col: "", sk: 1 },
    { id: 3, n: "JR中央線", co: 2, cn: "JR東日本", col: "", sk: 0 },
  ],
  stations: [tokyo, shinjuku, sapporo, hakata],
};

describe("evaluateEki", () => {
  it("Tokyo vs Shinjuku is a short east-west hop in Tokyo", () => {
    const g = evaluateEki(shinjuku, tokyo);
    expect(g.pref).toBe("same");
    expect(g.sameRegion).toBe(true);
    expect(g.km).toBeGreaterThan(4);
    expect(g.km).toBeLessThan(15);
    expect(g.sharedLines.length).toBeGreaterThan(0);
    expect(g.sameCity).toBe(false);
    expect(["E", "SE", "NE"]).toContain(g.compass);
  });

  it("Sapporo vs Hakata is far and south", () => {
    const g = evaluateEki(sapporo, hakata);
    expect(g.pref).toBe("far");
    expect(g.sameRegion).toBe(false);
    expect(g.km).toBeGreaterThan(1000);
    expect(g.compass === "S" || g.compass === "SW" || g.compass === "SE").toBe(
      true,
    );
  });
});

describe("Catalog.search", () => {
  const cat = new Catalog(data);

  it("finds Tokyo by romaji and kana", () => {
    expect(cat.search("tokyo")[0]?.n).toBe("東京");
    expect(cat.search("とうきょう")[0]?.n).toBe("東京");
    expect(cat.search("新宿")[0]?.n).toBe("新宿");
  });

  it("filters puzzle ids by region scope", () => {
    expect(cat.puzzleIdsFor("kanto").length).toBeGreaterThan(0);
    expect(cat.puzzleIdsFor("kansai")).toEqual([]);
  });
});
