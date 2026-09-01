import { adjacentPref, regionOf } from "./prefectures";
import { bearingDeg, compass8, haversineKm, proximityPct } from "./geo";
import type { EkiGuess, Station } from "./types";

export const EKI_MAX = 6;

export function evaluateEki(guess: Station, target: Station): EkiGuess {
  const km = haversineKm(guess.lat, guess.lng, target.lat, target.lng);
  const bearing = bearingDeg(guess.lat, guess.lng, target.lat, target.lng);
  const sharedLines = guess.l.filter((id) => target.l.includes(id));
  const sameCompany = guess.co.some((c) => target.co.includes(c));
  const pref =
    guess.p === target.p ? "same" : adjacentPref(guess.p, target.p) ? "near" : "far";
  return {
    id: guess.id,
    km,
    bearing,
    compass: compass8(bearing),
    proximity: proximityPct(km),
    pref,
    sharedLines,
    sameCompany,
    sameRegion: regionOf(guess.p) === regionOf(target.p),
    sameCity: !!guess.ct && guess.ct === target.ct,
  };
}

export function lineChip(guess: EkiGuess): "correct" | "present" | "absent" {
  if (guess.sharedLines.length) return "correct";
  if (guess.sameCompany) return "present";
  return "absent";
}
