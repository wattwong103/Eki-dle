import { haversineKm } from "./geo";
import { regionOf } from "./prefectures";
import type { Lang, Scope, Station } from "./types";

export type MetroId =
  | "sapporo"
  | "sendai"
  | "tokyo"
  | "yokohama"
  | "nagoya"
  | "kyoto"
  | "osaka"
  | "kobe"
  | "hiroshima"
  | "fukuoka"
  | "naha";

export interface Metro {
  id: MetroId;
  ja: string;
  en: string;
  lat: number;
  lng: number;
  city?: string;
  pref?: number;
}

export const METROS: Metro[] = [
  { id: "sapporo", ja: "札幌", en: "Sapporo", lat: 43.0686, lng: 141.3508, city: "札幌市" },
  { id: "sendai", ja: "仙台", en: "Sendai", lat: 38.2601, lng: 140.8824, city: "仙台市" },
  { id: "tokyo", ja: "東京", en: "Tokyo", lat: 35.6814, lng: 139.7661, pref: 13 },
  { id: "yokohama", ja: "横浜", en: "Yokohama", lat: 35.4658, lng: 139.6223, city: "横浜市" },
  { id: "nagoya", ja: "名古屋", en: "Nagoya", lat: 35.1709, lng: 136.8815, city: "名古屋市" },
  { id: "kyoto", ja: "京都", en: "Kyoto", lat: 35.0116, lng: 135.7681, city: "京都市" },
  { id: "osaka", ja: "大阪", en: "Osaka", lat: 34.7025, lng: 135.4959, city: "大阪市" },
  { id: "kobe", ja: "神戸", en: "Kobe", lat: 34.6793, lng: 135.1781, city: "神戸市" },
  { id: "hiroshima", ja: "広島", en: "Hiroshima", lat: 34.3976, lng: 132.4754, city: "広島市" },
  { id: "fukuoka", ja: "福岡", en: "Fukuoka", lat: 33.5897, lng: 130.4207, city: "福岡市" },
  { id: "naha", ja: "那覇", en: "Naha", lat: 26.2124, lng: 127.6809, city: "那覇市", pref: 47 },
];

export const ALL_SCOPES: Scope[] = [
  "all",
  "hokkaido",
  "tohoku",
  "kanto",
  "chubu",
  "kansai",
  "chugoku",
  "shikoku",
  "kyushu",
  "shinkansen",
  "jr",
  "sapporo",
  "sendai",
  "tokyo",
  "yokohama",
  "nagoya",
  "kyoto",
  "osaka",
  "kobe",
  "hiroshima",
  "fukuoka",
  "naha",
];

export function isScope(v: string | undefined): v is Scope {
  return !!v && (ALL_SCOPES as string[]).includes(v);
}

export function nearestMetro(lat: number, lng: number): Metro {
  let best = METROS[0]!;
  let bestKm = Infinity;
  for (const m of METROS) {
    const km = haversineKm(lat, lng, m.lat, m.lng);
    if (km < bestKm) {
      bestKm = km;
      best = m;
    }
  }
  return best;
}

export function stationInMetro(s: Station, metro: Metro): boolean {
  if (metro.id === "tokyo") return s.p === 13;
  if (metro.id === "naha") return s.p === 47 || s.ct === "那覇市";
  if (metro.city) return s.ct === metro.city;
  if (metro.pref) return s.p === metro.pref;
  return false;
}

export function stationInRegionScope(s: Station, scope: Scope): boolean {
  const r = regionOf(s.p);
  return r === scope;
}

export function metroName(m: Metro, lang: Lang): string {
  return lang === "en" ? m.en : m.ja;
}

export function cityStripHtml(
  guess: Station | null,
  target: Station | null,
  reveal: boolean,
  lang: Lang,
): string {
  const gMetro = guess ? nearestMetro(guess.lat, guess.lng) : null;
  const tMetro = target && reveal ? nearestMetro(target.lat, target.lng) : null;
  const nodes = METROS.map((m) => {
    const isG = gMetro?.id === m.id;
    const isT = tMetro?.id === m.id;
    const cls = isT ? "is-target" : isG ? "is-guess" : "";
    const mark = isT ? "★" : isG ? "●" : "○";
    return `<li class="${cls}"><span class="dot">${mark}</span>${metroName(m, lang)}</li>`;
  }).join("");
  return `<ol class="city-strip">${nodes}</ol>`;
}
