import { describe, expect, it } from "vitest";
import { bearingDeg, compass8, haversineKm, proximityPct } from "./geo";

describe("haversineKm", () => {
  it("is ~0 for the same point", () => {
    expect(haversineKm(35.681, 139.766, 35.681, 139.766)).toBeCloseTo(0, 5);
  });

  it("Tokyo to Osaka is about 400 km", () => {
    const km = haversineKm(35.681391, 139.766103, 34.702485, 135.495951);
    expect(km).toBeGreaterThan(380);
    expect(km).toBeLessThan(430);
  });
});

describe("bearingDeg", () => {
  it("points west from Tokyo toward Osaka", () => {
    const b = bearingDeg(35.681391, 139.766103, 34.702485, 135.495951);
    expect(compass8(b)).toBe("W");
  });

  it("points east from Osaka toward Tokyo", () => {
    const b = bearingDeg(34.702485, 135.495951, 35.681391, 139.766103);
    expect(compass8(b)).toBe("E");
  });
});

describe("proximityPct", () => {
  it("is 100 at 0 km and 0 at max", () => {
    expect(proximityPct(0)).toBe(100);
    expect(proximityPct(2800)).toBe(0);
  });

  it("separates city-scale from regional misses", () => {
    const city = proximityPct(24);
    const region = proximityPct(400);
    expect(city).toBeGreaterThan(50);
    expect(city).toBeLessThan(80);
    expect(region).toBeLessThan(40);
    expect(city).toBeGreaterThan(region);
  });
});
