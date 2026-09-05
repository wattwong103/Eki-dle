export interface Line {
  id: number;
  n: string;
  co: number;
  cn: string;
  col: string;
  sk: number;
}

export interface Station {
  id: number;
  n: string;
  o: string;
  k: string;
  r: string;
  p: number;
  ct: string;
  y: number;
  lat: number;
  lng: number;
  l: number[];
  co: number[];
  f: number;
  /** Per-line register info: [lineIndex, stationNumbering ("M09" or ""), stopOrder]. */
  c?: [number, string, number][];
}

export interface StationCode {
  line: number;
  code: string;
  order: number;
}

export interface GameMeta {
  source: string;
  license: string;
  tag: string;
  builtAt: string;
  stations: number;
  lines: number;
  puzzle: number;
  kana4: number;
  kana5: number;
  mora4: number;
  mora5: number;
}

export interface GameData {
  meta: GameMeta;
  lines: Line[];
  stations: Station[];
}

export const FLAG_PUZZLE = 1;
export const FLAG_SHINKANSEN = 2;

export type Lang = "ja" | "en";
export type Theme = "night" | "day";
export type Mode = "eki" | "moji" | "rosen" | "map" | "code" | "diagram";
export type PlayKind = "daily" | "practice";
export type TileKind = "correct" | "present" | "absent" | "empty";
export type Scope =
  | "all"
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kansai"
  | "chugoku"
  | "shikoku"
  | "kyushu"
  | "shinkansen"
  | "jr"
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

export interface Settings {
  lang: Lang;
  theme: Theme;
  colorblind: boolean;
  scope: Scope;
}

export interface EkiGuess {
  id: number;
  km: number;
  bearing: number;
  compass: string;
  proximity: number;
  pref: "same" | "near" | "far";
  sharedLines: number[];
  sameCompany: boolean;
  sameRegion: boolean;
  sameCity: boolean;
}

export interface EkiState {
  kind: PlayKind;
  puzzleNo: number;
  dateKey: string;
  targetId: number;
  guesses: EkiGuess[];
  status: "playing" | "won" | "lost";
}

export interface MojiState {
  kind: PlayKind;
  puzzleNo: number;
  dateKey: string;
  targetId: number;
  length: number;
  rows: TileKind[][];
  letters: string[][];
  current: string[];
  status: "playing" | "won" | "lost";
}

export interface RosenGuess {
  index: number;
  sameCompany: boolean;
  sameRegion: boolean;
  sharedPrefs: number[];
  count: number;
  countDelta: number;
  shinkansen: boolean;
}

export interface RosenState {
  kind: PlayKind;
  puzzleNo: number;
  dateKey: string;
  targetIndex: number;
  guesses: RosenGuess[];
  status: "playing" | "won" | "lost";
}

export interface Stats {
  played: number;
  wins: number;
  streak: number;
  maxStreak: number;
  lastDate: string;
  dist: number[];
}
