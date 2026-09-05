import { describe, expect, it } from "vitest";
import { TILE_ZOOM, tileXY, tileUrl, tiles3x3 } from "./mapview";

describe("mapview tiles", () => {
  it("computes tile indices at fixed zoom", () => {
    const t = tileXY(139.7661, 35.6814, TILE_ZOOM);
    expect(t.x).toBeGreaterThan(0);
    expect(t.y).toBeGreaterThan(0);
  });

  it("builds 3x3 set and carto url", () => {
    const tiles = tiles3x3({ x: 1, y: 2 }, TILE_ZOOM);
    expect(tiles).toHaveLength(9);
    expect(tileUrl(1, 2, 15)).toContain("light_nolabels/15/1/2.png");
  });
});
