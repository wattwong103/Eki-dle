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
  | "naha"
  | "kawasaki"
  | "chiba"
  | "kitakyushu"
  | "kumamoto"
  | "okayama"
  | "toyama"
  | "kagoshima";

/** Tokyo 23 special wards (`ct` ends with 区). Tama cities are not Tokyo. */
export const TOKYO_WARD_SUFFIX = "区";

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
  { id: "kawasaki", ja: "川崎", en: "Kawasaki", lat: 35.5313, lng: 139.6975, city: "川崎市" },
  { id: "chiba", ja: "千葉", en: "Chiba", lat: 35.6129, lng: 140.1135, city: "千葉市" },
  { id: "kitakyushu", ja: "北九州", en: "Kitakyushu", lat: 33.8868, lng: 130.8827, city: "北九州市" },
  { id: "kumamoto", ja: "熊本", en: "Kumamoto", lat: 32.7899, lng: 130.689, city: "熊本市" },
  { id: "okayama", ja: "岡山", en: "Okayama", lat: 34.6666, lng: 133.9186, city: "岡山市" },
  { id: "toyama", ja: "富山", en: "Toyama", lat: 36.7016, lng: 137.2133, city: "富山市" },
  { id: "kagoshima", ja: "鹿児島", en: "Kagoshima", lat: 31.5837, lng: 130.5418, city: "鹿児島市" },
];

/** Japan-map city labels — keep this small so the outline stays readable. */
export const MAP_LABEL_IDS: MetroId[] = [
  "sapporo",
  "sendai",
  "tokyo",
  "nagoya",
  "osaka",
  "hiroshima",
  "fukuoka",
  "naha",
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
  "kawasaki",
  "chiba",
  "kitakyushu",
  "kumamoto",
  "okayama",
  "toyama",
  "kagoshima",
  "jreast",
  "tokyometro",
  "tokyu",
  "hankyu",
  "kintetsu",
  "meitetsu",
];

export const REGION_SCOPES: Scope[] = [
  "hokkaido",
  "tohoku",
  "kanto",
  "chubu",
  "kansai",
  "chugoku",
  "shikoku",
  "kyushu",
];

export const CITY_SCOPES: Scope[] = METROS.map((m) => m.id as Scope);

export const SPECIAL_SCOPES: Scope[] = ["shinkansen", "jr"];

/** Private / JR-East chips for Line (and Station) area. Company codes from station_database. */
export const OPERATOR_COS: Partial<Record<Scope, number>> = {
  jreast: 2,
  tokyometro: 18,
  tokyu: 16,
  hankyu: 24,
  kintetsu: 21,
  meitetsu: 20,
};

export const OPERATOR_SCOPES: Scope[] = [
  "jreast",
  "tokyometro",
  "tokyu",
  "hankyu",
  "kintetsu",
  "meitetsu",
];

export const LINE_CITY_MIN_STOPS = 3;

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
  if (metro.id === "tokyo") return s.p === 13 && (s.ct || "").endsWith(TOKYO_WARD_SUFFIX);
  if (metro.id === "naha") return s.p === 47 || s.ct === "那覇市";
  if (metro.city) return s.ct === metro.city;
  if (metro.pref) return s.p === metro.pref;
  return false;
}

export function operatorCo(scope: Scope): number | undefined {
  return OPERATOR_COS[scope];
}

export function stationInRegionScope(s: Station, scope: Scope): boolean {
  const r = regionOf(s.p);
  return r === scope;
}

export function metroName(m: Metro, lang: Lang): string {
  return lang === "en" ? m.en : m.ja;
}

/** One-line nearest-metro mark for Station mode. */
export function nearestMetroLineHtml(
  guess: Station | null,
  target: Station | null,
  reveal: boolean,
  lang: Lang,
  label: string,
): string {
  const gMetro = guess ? nearestMetro(guess.lat, guess.lng) : null;
  const tMetro = target && reveal ? nearestMetro(target.lat, target.lng) : null;
  if (!gMetro && !tMetro) return "";
  const same = gMetro && tMetro && gMetro.id === tMetro.id;
  const bits: string[] = [];
  if (same && tMetro) {
    bits.push(`<span class="is-target">★ ${metroName(tMetro, lang)}</span>`);
  } else {
    if (gMetro) bits.push(`<span class="is-guess">● ${metroName(gMetro, lang)}</span>`);
    if (tMetro) bits.push(`<span class="is-target">★ ${metroName(tMetro, lang)}</span>`);
  }
  return `<p class="city-strip city-strip-one">${label} ${bits.join(" ")}</p>`;
}
