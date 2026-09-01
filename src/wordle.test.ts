import { describe, expect, it } from "vitest";
import {
  applyDakuten,
  applyHandakuten,
  applySmall,
  kanaChars,
  scoreWordle,
} from "./wordle";

describe("scoreWordle", () => {
  it("marks exact matches green", () => {
    const g = kanaChars("しんじゅく");
    expect(scoreWordle(g, g)).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("marks present letters yellow once", () => {
    // いけぶくろ vs しんじゅく — く is present
    const guess = kanaChars("いけぶくろ");
    const answer = kanaChars("しんじゅく");
    const r = scoreWordle(guess, answer);
    expect(guess).toHaveLength(5);
    expect(r[3]).toBe("present");
    expect(r.filter((x) => x === "present")).toHaveLength(1);
  });

  it("does not double-count yellows", () => {
    const guess = ["あ", "あ", "い", "う", "え"];
    const answer = ["あ", "か", "き", "く", "け"];
    const r = scoreWordle(guess, answer);
    expect(r[0]).toBe("correct");
    expect(r[1]).toBe("absent");
  });

  it("treats small kana as distinct", () => {
    const guess = kanaChars("きょうとあ");
    const answer = kanaChars("きようとあ");
    expect(guess[1]).toBe("ょ");
    expect(answer[1]).toBe("よ");
    const r = scoreWordle(guess, answer);
    expect(r[1]).not.toBe("correct");
  });
});

describe("kana modifiers", () => {
  it("small, dakuten, handakuten", () => {
    expect(applySmall("つ")).toBe("っ");
    expect(applySmall("や")).toBe("ゃ");
    expect(applyDakuten("か")).toBe("が");
    expect(applyDakuten("が")).toBe("か");
    expect(applyHandakuten("は")).toBe("ぱ");
    expect(applyHandakuten("ぱ")).toBe("は");
  });
});
