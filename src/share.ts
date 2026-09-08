import { COMPASS_EMOJI, type Compass8 } from "./geo";
import { lineChip } from "./eki";
import type { EkiState, Lang, MojiState, RosenState, TileKind } from "./types";

export const SITE = "https://wattwong103.github.io/Eki-dle/";

const TILE: Record<TileKind, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
  empty: "⬜",
};

function prefEmoji(pref: EkiState["guesses"][number]["pref"]): string {
  if (pref === "same") return "🟩";
  if (pref === "near") return "🟨";
  return "⬛";
}

function lineEmoji(g: EkiState["guesses"][number]): string {
  const k = lineChip(g);
  return k === "correct" ? "🟩" : k === "present" ? "🟨" : "⬛";
}

function shareHead(title: string, state: { kind: string; puzzleNo: number; status: string; }, n: number, lang: Lang, scope = ""): string {
  const area = scope ? ` · ${scope}` : "";
  const num = state.kind === "daily" ? `#${state.puzzleNo}` : lang === "ja" ? "練習" : "practice";
  const score = state.status === "won" ? `${n}/6` : "X/6";
  return `${title}${area} ${num} ${score}`;
}

export function shareEki(state: EkiState, lang: Lang, scope = ""): string {
  return shareStationLike(state, lang, lang === "ja" ? "駅dle" : "Eki-dle", scope, true);
}

function shareStationLike(
  state: EkiState,
  lang: Lang,
  title: string,
  scope: string,
  withKm: boolean,
): string {
  const n = state.guesses.length;
  const head = shareHead(title, state, n, lang, scope);
  const rows = state.guesses.map((g) => {
    if (g.id === state.targetId) return `${prefEmoji("same")}${lineEmoji(g)} 🎉`;
    if (!withKm) return `${prefEmoji(g.pref)}${lineEmoji(g)}`;
    const arrow = COMPASS_EMOJI[g.compass as Compass8] ?? "➡️";
    return `${prefEmoji(g.pref)}${lineEmoji(g)} ${Math.round(g.km)}km ${arrow}`;
  });
  return [head, ...rows, SITE].join("\n");
}

export function shareMap(state: EkiState, lang: Lang, scope = ""): string {
  return shareStationLike(state, lang, lang === "ja" ? "駅dle 地図" : "Eki-dle Map", scope, false);
}

export function shareCode(state: EkiState, lang: Lang, scope = ""): string {
  return shareStationLike(state, lang, lang === "ja" ? "駅dle コード" : "Eki-dle Code", scope, false);
}

export function shareDiagram(state: EkiState, lang: Lang, scope = ""): string {
  return shareStationLike(state, lang, lang === "ja" ? "駅dle 路線図" : "Eki-dle Diagram", scope, false);
}

export function shareMoji(state: MojiState, lang: Lang, scope = ""): string {
  const n = state.rows.length;
  const head = shareHead(lang === "ja" ? "駅dle 文字" : "Eki-dle Kana", state, n, lang, scope);
  const rows = state.rows.map((row) => row.map((k) => TILE[k]).join(""));
  return [head, ...rows, SITE].join("\n");
}

export function shareRosen(state: RosenState, lang: Lang, scope = ""): string {
  const n = state.guesses.length;
  const head = shareHead(lang === "ja" ? "駅dle 路線" : "Eki-dle Line", state, n, lang, scope);
  const rows = state.guesses.map((g) => {
    if (g.index === state.targetIndex) return `🟩🟩🟩 🎉`;
    const co = g.sameCompany ? "🟩" : "⬛";
    const rg = g.sameRegion ? "🟩" : g.sharedPrefs.length ? "🟨" : "⬛";
    const ct = g.countDelta === 0 ? "🟩" : "⬛";
    const arrow = g.countDelta === 0 ? "=" : g.countDelta > 0 ? "↑" : "↓";
    return `${co}${rg}${ct} ${arrow}${Math.abs(g.countDelta)}`;
  });
  return [head, ...rows, SITE].join("\n");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
