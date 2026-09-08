import { describe, expect, it } from "vitest";
import { shareCode, shareEki, shareMap } from "./share";
import type { EkiState } from "./types";

const state: EkiState = {
  kind: "daily",
  puzzleNo: 251,
  dateKey: "2026-09-08",
  targetId: 1,
  status: "won",
  guesses: [
    {
      id: 2,
      km: 847,
      bearing: 180,
      compass: "S",
      proximity: 20,
      pref: "far",
      sharedLines: [],
      sameCompany: false,
      sameRegion: false,
      sameCity: false,
    },
    {
      id: 1,
      km: 0,
      bearing: 0,
      compass: "N",
      proximity: 100,
      pref: "same",
      sharedLines: [0],
      sameCompany: true,
      sameRegion: true,
      sameCity: true,
    },
  ],
};

describe("share cards", () => {
  it("Station includes km and optional scope", () => {
    const text = shareEki(state, "en", "Tokyo");
    expect(text).toContain("Eki-dle · Tokyo #251 2/6");
    expect(text).toContain("847km");
  });

  it("Map omits km and includes scope", () => {
    const text = shareMap(state, "ja", "東京");
    expect(text).toContain("駅dle 地図 · 東京 #251 2/6");
    expect(text).not.toContain("847");
    expect(text).not.toContain("km");
  });

  it("Code omits km", () => {
    const text = shareCode(state, "en");
    expect(text).toContain("Eki-dle Code #251 2/6");
    expect(text).not.toContain("km");
  });
});
