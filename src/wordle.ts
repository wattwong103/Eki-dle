import type { TileKind } from "./types";

export const MOJI_LEN = 5;

export function toHiragana(s: string): string {
  return [...s.normalize("NFKC")]
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 0x30a1 && c <= 0x30f6) return String.fromCharCode(c - 0x60);
      return ch;
    })
    .join("");
}

export function kanaChars(s: string): string[] {
  return [...toHiragana(s).replace(/[^\u3041-\u3096ー]/g, "")];
}

export function scoreWordle(guess: string[], answer: string[]): TileKind[] {
  const n = answer.length;
  const result: TileKind[] = Array.from({ length: n }, () => "absent");
  const remaining: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const g = guess[i] ?? "";
    const a = answer[i] ?? "";
    if (g === a) {
      result[i] = "correct";
    } else {
      remaining[a] = (remaining[a] ?? 0) + 1;
    }
  }
  for (let i = 0; i < n; i++) {
    if (result[i] === "correct") continue;
    const g = guess[i] ?? "";
    const left = remaining[g] ?? 0;
    if (left > 0) {
      result[i] = "present";
      remaining[g] = left - 1;
    }
  }
  return result;
}

const SMALL: Record<string, string> = {
  あ: "ぁ",
  い: "ぃ",
  う: "ぅ",
  え: "ぇ",
  お: "ぉ",
  や: "ゃ",
  ゆ: "ゅ",
  よ: "ょ",
  つ: "っ",
  わ: "ゎ",
};

const DAKU: Record<string, string> = {
  か: "が",
  き: "ぎ",
  く: "ぐ",
  け: "げ",
  こ: "ご",
  さ: "ざ",
  し: "じ",
  す: "ず",
  せ: "ぜ",
  そ: "ぞ",
  た: "だ",
  ち: "ぢ",
  つ: "づ",
  て: "で",
  と: "ど",
  は: "ば",
  ひ: "び",
  ふ: "ぶ",
  へ: "べ",
  ほ: "ぼ",
  う: "ゔ",
};

const HANDA: Record<string, string> = {
  は: "ぱ",
  ひ: "ぴ",
  ふ: "ぷ",
  へ: "ぺ",
  ほ: "ぽ",
};

export function applySmall(ch: string): string {
  return SMALL[ch] ?? ch;
}

export function applyDakuten(ch: string): string {
  if (DAKU[ch]) return DAKU[ch]!;
  const inv = Object.entries(DAKU).find(([, v]) => v === ch);
  if (inv) return inv[0];
  const fromHand = Object.entries(HANDA).find(([, v]) => v === ch);
  if (fromHand) return DAKU[fromHand[0]] ?? ch;
  return ch;
}

export function applyHandakuten(ch: string): string {
  if (HANDA[ch]) return HANDA[ch]!;
  const fromDakuHa = Object.entries(DAKU).find(([, v]) => v === ch);
  if (fromDakuHa && HANDA[fromDakuHa[0]]) return HANDA[fromDakuHa[0]]!;
  const inv = Object.entries(HANDA).find(([, v]) => v === ch);
  if (inv) return inv[0];
  return ch;
}

export const KANA_ROWS = [
  ["わ", "ら", "や", "ま", "は", "な", "た", "さ", "か", "あ"],
  ["ん", "り", "ゆ", "み", "ひ", "に", "ち", "し", "き", "い"],
  ["ー", "る", "よ", "む", "ふ", "ぬ", "つ", "す", "く", "う"],
  ["", "れ", "", "め", "へ", "ね", "て", "せ", "け", "え"],
  ["", "ろ", "", "も", "ほ", "の", "と", "そ", "こ", "お"],
] as const;
