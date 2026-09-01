import { describe, expect, it } from "vitest";
import { jstDateKey, nextJstMidnightMs, pickId, puzzleNumber } from "./daily";

describe("jstDateKey", () => {
  it("uses JST, not local/UTC", () => {
    // 2026-09-01 15:30 UTC = 2026-09-02 00:30 JST
    const d = new Date("2026-09-01T15:30:00Z");
    expect(jstDateKey(d)).toBe("2026-09-02");
    // 2026-09-01 14:59 UTC = 2026-09-01 23:59 JST
    const e = new Date("2026-09-01T14:59:00Z");
    expect(jstDateKey(e)).toBe("2026-09-01");
  });
});

describe("puzzleNumber", () => {
  it("is 1 on the epoch day", () => {
    expect(puzzleNumber("2026-01-01")).toBe(1);
    expect(puzzleNumber("2026-01-02")).toBe(2);
  });
});

describe("pickId", () => {
  it("is deterministic", () => {
    const ids = [10, 20, 30, 40, 50];
    expect(pickId(ids, 7, "eki")).toBe(pickId(ids, 7, "eki"));
    expect(pickId(ids, 7, "eki")).not.toBe(pickId(ids, 8, "eki"));
  });
});

describe("nextJstMidnightMs", () => {
  it("lands on the next 15:00 UTC", () => {
    const now = new Date("2026-09-02T01:00:00Z");
    const next = nextJstMidnightMs(now);
    expect(new Date(next).toISOString()).toBe("2026-09-02T15:00:00.000Z");
  });
});
