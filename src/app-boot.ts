import { Catalog } from "./catalog";
import { loadJapanRings } from "./map";
import { loadCrops, type DiagramCrop } from "./crops";
import type { GameData, Lang } from "./types";
import { t } from "./i18n";
import { startGame } from "./app-game";
import "./styles.css";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export async function boot(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app missing");
  const langGuess: Lang = navigator.language.startsWith("ja") ? "ja" : "en";
  root.innerHTML = `<div class="boot"><div class="mark">駅</div><p>${esc(t(langGuess).loading)}</p></div>`;
  try {
    const [gameRes, rings, crops] = await Promise.all([
      fetch("./data/game.json"),
      loadJapanRings(),
      loadCrops().catch(() => [] as DiagramCrop[]),
    ]);
    if (!gameRes.ok) throw new Error(String(gameRes.status));
    const data = (await gameRes.json()) as GameData;
    startGame(root, new Catalog(data), rings, crops);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="error"><p>${esc(t("en").loadError)}</p></div>`;
  }
}
