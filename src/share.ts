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

export function shareEki(state: EkiState, lang: Lang): string {
  const n = state.guesses.length;
  const head =
    lang === "ja"
      ? `駅dle ${state.kind === "daily" ? `#${state.puzzleNo}` : "練習"} ${state.status === "won" ? `${n}/6` : "X/6"}`
      : `Eki-dle ${state.kind === "daily" ? `#${state.puzzleNo}` : "practice"} ${state.status === "won" ? `${n}/6` : "X/6"}`;
  const rows = state.guesses.map((g) => {
    if (g.id === state.targetId) return `${prefEmoji("same")}${lineEmoji(g)} 🎉`;
    const arrow = COMPASS_EMOJI[g.compass as Compass8] ?? "➡️";
    return `${prefEmoji(g.pref)}${lineEmoji(g)} ${Math.round(g.km)}km ${arrow}`;
  });
  return [head, ...rows, SITE].join("\n");
}

export function shareMoji(state: MojiState, lang: Lang): string {
  const n = state.rows.length;
  const head =
    lang === "ja"
      ? `駅dle 文字 ${state.kind === "daily" ? `#${state.puzzleNo}` : "練習"} ${state.status === "won" ? `${n}/6` : "X/6"}`
      : `Eki-dle Kana ${state.kind === "daily" ? `#${state.puzzleNo}` : "practice"} ${state.status === "won" ? `${n}/6` : "X/6"}`;
  const rows = state.rows.map((row) => row.map((k) => TILE[k]).join(""));
  return [head, ...rows, SITE].join("\n");
}

export function shareRosen(state: RosenState, lang: Lang): string {
  const n = state.guesses.length;
  const head =
    lang === "ja"
      ? `駅dle 路線 ${state.kind === "daily" ? `#${state.puzzleNo}` : "練習"} ${state.status === "won" ? `${n}/6` : "X/6"}`
      : `Eki-dle Line ${state.kind === "daily" ? `#${state.puzzleNo}` : "practice"} ${state.status === "won" ? `${n}/6` : "X/6"}`;
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
