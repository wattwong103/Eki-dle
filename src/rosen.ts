import type { LineInfo } from "./catalog";
import type { RosenGuess } from "./types";

export function evaluateRosen(guess: LineInfo, target: LineInfo): RosenGuess {
  const sharedPrefs = guess.prefs.filter((p) => target.prefs.includes(p));
  return {
    index: guess.index,
    sameCompany: guess.line.co !== 0 && guess.line.co === target.line.co,
    sameRegion: guess.region === target.region,
    sharedPrefs,
    count: guess.count,
    countDelta: guess.count - target.count,
    shinkansen: guess.line.sk === 1,
  };
}
