import type { Lang, Line, Station } from "./types";

/** Primary station label: romaji in EN, kanji in JA. */
export function stationPrimary(s: Station, lang: Lang): string {
  if (lang === "en") return s.r || s.n;
  return s.n;
}

/** Secondary station label: kanji (+ kana) in EN; kana · romaji in JA. */
export function stationSecondary(s: Station, lang: Lang): string {
  if (lang === "en") {
    if (s.k) return `${s.n} · ${s.k}`;
    return s.n;
  }
  if (s.r) return `${s.k} · ${s.r}`;
  return s.k || "";
}

/** Primary line label: romaji/English in EN, Japanese name in JA. */
export function linePrimary(line: Line, lang: Lang): string {
  if (lang === "en") return line.r || line.n;
  return line.n;
}

/** Operator / company name for the given UI language. */
export function operatorName(line: Line, lang: Lang): string {
  if (lang === "en") return line.ce || line.cn || "";
  return line.cn || "";
}
