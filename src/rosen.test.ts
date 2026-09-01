import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";
import { evaluateRosen } from "./rosen";
import type { GameData, Line, Station } from "./types";

function line(partial: Partial<Line> & Pick<Line, "id" | "n">): Line {
  return { co: 2, cn: "JR東日本", col: "#9ACD32", sk: 0, ...partial };
}

function st(
  partial: Partial<Station> & Pick<Station, "id" | "n" | "p" | "lat" | "lng" | "l">,
): Station {
  return { o: "", k: "", r: "", co: [2], f: 1, ct: "", y: 0, ...partial };
}

const data: GameData = {
  meta: {
    source: "test",
    license: "CC BY 4.0",
    tag: "test",
    builtAt: "",
    stations: 4,
    lines: 2,
    puzzle: 4,
    kana4: 0,
    kana5: 0,
    mora4: 0,
    mora5: 0,
  },
  lines: [
    line({ id: 1, n: "JR山手線", sk: 0 }),
    line({ id: 2, n: "東海道新幹線", co: 3, cn: "JR東海", col: "#0000FF", sk: 1 }),
  ],
  stations: [
    st({ id: 1, n: "東京", p: 13, lat: 35.68, lng: 139.76, l: [0, 1], f: 3 }),
    st({ id: 2, n: "新宿", p: 13, lat: 35.69, lng: 139.7, l: [0] }),
    st({ id: 3, n: "品川", p: 13, lat: 35.62, lng: 139.73, l: [0, 1], f: 3 }),
    st({ id: 4, n: "名古屋", p: 23, lat: 35.17, lng: 136.88, l: [1], f: 3 }),
  ],
};

describe("Catalog line extras", () => {
  const cat = new Catalog(data);

  it("counts stations and prefectures per line", () => {
    expect(cat.lineInfo(0).count).toBe(3);
    expect(cat.lineInfo(0).prefs).toEqual([13]);
    expect(cat.lineInfo(1).count).toBe(3);
    expect(cat.lineInfo(1).prefs).toContain(13);
    expect(cat.lineInfo(1).prefs).toContain(23);
  });

  it("finds a line by substring", () => {
    expect(cat.searchLines("山手")[0]?.line.n).toBe("JR山手線");
  });
});

describe("evaluateRosen", () => {
  const cat = new Catalog(data);

  it("marks shared company/region and station-count delta", () => {
    const g = evaluateRosen(cat.lineInfo(0), cat.lineInfo(1));
    expect(g.sameCompany).toBe(false);
    expect(g.sharedPrefs).toContain(13);
    expect(g.countDelta).toBe(0);
    expect(g.shinkansen).toBe(false);
  });
});
