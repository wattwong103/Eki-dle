import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Catalog } from "./catalog";
import { fallbackDiagramSvg, parseCropsManifest, spiderDiagramSvg } from "./crops";
import type { GameData, Line, Station } from "./types";

function line(partial: Partial<Line> & Pick<Line, "id" | "n">): Line {
  return { co: 2, cn: "Op", col: "#c00", sk: 0, ...partial };
}

function st(partial: Partial<Station> & Pick<Station, "id" | "n" | "p" | "lat" | "lng" | "l">): Station {
  return { o: "", k: "", r: "", co: [2], f: 1, ct: "", y: 2000, c: [], ...partial };
}

describe("crops manifest", () => {
  it("parses valid entries and skips invalid rows", () => {
    const parsed = parseCropsManifest({
      crops: [
        { id: 1, file: "tokyo.svg", hub: "Tokyo", source: "Generated from station_database", license: "CC BY 4.0" },
        { id: "x", file: "bad.png", hub: "Bad" },
      ],
    });
    expect(parsed).toEqual([
      {
        id: 1,
        file: "tokyo.svg",
        hub: "Tokyo",
        license: "CC BY 4.0",
        source: "Generated from station_database",
      },
    ]);
  });

  it("every manifest file exists on disk", () => {
    const raw = JSON.parse(fs.readFileSync("public/data/crops/crops.json", "utf8"));
    const crops = parseCropsManifest(raw);
    expect(crops.length).toBeGreaterThan(0);
    for (const crop of crops) {
      expect(crop.hub === "Tokyo" || crop.hub === "Osaka").toBe(true);
      expect(crop.license).toMatch(/CC BY 4\.0/i);
      const p = path.join("public/data/crops", crop.file);
      expect(fs.existsSync(p), `missing ${p}`).toBe(true);
    }
  });

  it("builds spoiler-safe spider svg from catalog geometry", () => {
    const data: GameData = {
      meta: {
        source: "t",
        license: "CC",
        tag: "t",
        builtAt: "",
        stations: 3,
        lines: 2,
        puzzle: 1,
        kana4: 0,
        kana5: 0,
        mora4: 0,
        mora5: 0,
      },
      lines: [line({ id: 1, n: "A", col: "#e11" }), line({ id: 2, n: "B", col: "#11e" })],
      stations: [
        st({ id: 1, n: "Secret", r: "SecretRoma", p: 13, lat: 35, lng: 139, l: [0, 1], c: [[0, "A1", 1], [1, "B1", 1]] }),
        st({ id: 2, n: "N2", p: 13, lat: 35.1, lng: 139.1, l: [0], c: [[0, "A2", 2]] }),
        st({ id: 3, n: "N3", p: 13, lat: 35.2, lng: 139.2, l: [1], c: [[1, "B2", 2]] }),
      ],
    };
    const catalog = new Catalog(data);
    const target = catalog.station(1);
    const url = spiderDiagramSvg(catalog, target);
    expect(url.startsWith("data:image/svg+xml")).toBe(true);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
    expect(decoded).toContain("???");
    expect(decoded).not.toContain("Secret");
    expect(decoded).not.toContain("SecretRoma");
  });

  it("legacy fallbackDiagramSvg never embeds the label string", () => {
    const url = fallbackDiagramSvg("TokyoStationName");
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
    expect(decoded).not.toContain("TokyoStationName");
    expect(decoded).toContain("???");
  });
});
