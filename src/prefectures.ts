export const PREF_JA = [
  "",
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

export const PREF_EN = [
  "",
  "Hokkaido",
  "Aomori",
  "Iwate",
  "Miyagi",
  "Akita",
  "Yamagata",
  "Fukushima",
  "Ibaraki",
  "Tochigi",
  "Gunma",
  "Saitama",
  "Chiba",
  "Tokyo",
  "Kanagawa",
  "Niigata",
  "Toyama",
  "Ishikawa",
  "Fukui",
  "Yamanashi",
  "Nagano",
  "Gifu",
  "Shizuoka",
  "Aichi",
  "Mie",
  "Shiga",
  "Kyoto",
  "Osaka",
  "Hyogo",
  "Nara",
  "Wakayama",
  "Tottori",
  "Shimane",
  "Okayama",
  "Hiroshima",
  "Yamaguchi",
  "Tokushima",
  "Kagawa",
  "Ehime",
  "Kochi",
  "Fukuoka",
  "Saga",
  "Nagasaki",
  "Kumamoto",
  "Oita",
  "Miyazaki",
  "Kagoshima",
  "Okinawa",
] as const;

const NEIGHBORS: Record<number, number[]> = {
  1: [2],
  2: [1, 3, 5],
  3: [2, 4, 5],
  4: [3, 5, 6, 7],
  5: [2, 3, 4, 6],
  6: [4, 5, 7, 15],
  7: [4, 6, 8, 9, 10, 15],
  8: [7, 9, 11, 12],
  9: [7, 8, 10, 11],
  10: [7, 9, 11, 15, 20],
  11: [8, 9, 10, 12, 13, 19],
  12: [8, 11, 13],
  13: [11, 12, 14, 19],
  14: [13, 19, 22],
  15: [6, 7, 10, 16, 20],
  16: [15, 17, 20, 21],
  17: [16, 18, 21],
  18: [17, 21, 25, 26],
  19: [11, 13, 14, 20, 22],
  20: [10, 15, 16, 19, 21, 22, 23],
  21: [16, 17, 18, 20, 23, 24, 25],
  22: [14, 19, 20, 23],
  23: [20, 21, 22, 24],
  24: [21, 23, 25, 26, 29, 30],
  25: [18, 21, 24, 26],
  26: [18, 24, 25, 27, 28, 29],
  27: [26, 28, 29],
  28: [26, 27, 29, 31, 33],
  29: [24, 26, 27, 28, 30],
  30: [24, 27, 29],
  31: [28, 32, 33, 34],
  32: [31, 34, 35],
  33: [28, 31, 34, 36],
  34: [31, 32, 33, 35, 37],
  35: [32, 34, 40],
  36: [33, 37, 38],
  37: [33, 34, 36, 38],
  38: [36, 37, 39],
  39: [36, 38],
  40: [35, 41, 42, 43, 44],
  41: [40, 42],
  42: [40, 41],
  43: [40, 44, 45, 46],
  44: [40, 43, 45],
  45: [43, 44, 46],
  46: [43, 45],
  47: [],
};

export type RegionId =
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kansai"
  | "chugoku"
  | "shikoku"
  | "kyushu";

export function regionOf(pref: number): RegionId {
  if (pref === 1) return "hokkaido";
  if (pref <= 7) return "tohoku";
  if (pref <= 14) return "kanto";
  if (pref <= 24) return "chubu";
  if (pref <= 30) return "kansai";
  if (pref <= 35) return "chugoku";
  if (pref <= 39) return "shikoku";
  return "kyushu";
}

export function adjacentPref(a: number, b: number): boolean {
  return (NEIGHBORS[a] ?? []).includes(b);
}

export function prefName(pref: number, lang: "ja" | "en"): string {
  const list = lang === "ja" ? PREF_JA : PREF_EN;
  return list[pref] ?? "";
}
