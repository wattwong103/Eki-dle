import { describe, expect, it } from "vitest";
import { nearestMetro, nearestMetroLineHtml, stationInMetro } from "./cities";
import type { Station } from "./types";

describe("nearestMetro", () => {
  it("maps Tokyo Station to Tokyo and Umeda to Osaka", () => {
    expect(nearestMetro(35.6814, 139.7661).id).toBe("tokyo");
    expect(nearestMetro(34.705, 135.498).id).toBe("osaka");
    expect(nearestMetro(43.068, 141.35).id).toBe("sapporo");
  });
});

describe("stationInMetro", () => {
  it("uses 23 wards for Tokyo and city name otherwise", () => {
    const tokyo = { p: 13, ct: "千代田区" } as Station;
    const hachioji = { p: 13, ct: "八王子市" } as Station;
    const yokohama = { p: 14, ct: "横浜市" } as Station;
    const metroT = nearestMetro(35.68, 139.77);
    const metroY = nearestMetro(35.47, 139.62);
    expect(stationInMetro(tokyo, metroT)).toBe(true);
    expect(stationInMetro(hachioji, metroT)).toBe(false);
    expect(stationInMetro(yokohama, metroT)).toBe(false);
    expect(stationInMetro(yokohama, metroY)).toBe(true);
  });
});

describe("nearestMetroLineHtml", () => {
  it("shows a single nearest-metro mark, not the full city list", () => {
    const html = nearestMetroLineHtml(
      { lat: 34.705, lng: 135.498 } as import("./types").Station,
      null,
      false,
      "en",
      "Nearest metro",
    );
    expect(html).toContain("Osaka");
    expect(html).not.toContain("Sapporo");
    expect(html).not.toContain("<ol");
  });
});

