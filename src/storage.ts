import type { EkiState, MojiState, Settings, Stats } from "./types";

const PREFIX = "ekidle:v1:";

export function loadSettings(): Settings {
  const raw = read(`${PREFIX}settings`);
  const s = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
  return {
    lang: s.lang === "en" ? "en" : "ja",
    theme: s.theme === "day" ? "day" : "night",
    colorblind: !!s.colorblind,
  };
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(`${PREFIX}settings`, JSON.stringify(s));
}

export function emptyStats(): Stats {
  return {
    played: 0,
    wins: 0,
    streak: 0,
    maxStreak: 0,
    lastDate: "",
    dist: [0, 0, 0, 0, 0, 0, 0],
  };
}

export function loadStats(mode: "eki" | "moji"): Stats {
  const raw = read(`${PREFIX}stats:${mode}`);
  if (!raw) return emptyStats();
  try {
    return { ...emptyStats(), ...(JSON.parse(raw) as Stats) };
  } catch {
    return emptyStats();
  }
}

export function saveStats(mode: "eki" | "moji", stats: Stats): void {
  localStorage.setItem(`${PREFIX}stats:${mode}`, JSON.stringify(stats));
}

export function recordFinish(
  mode: "eki" | "moji",
  dateKey: string,
  won: boolean,
  guesses: number,
): Stats {
  const stats = loadStats(mode);
  if (stats.lastDate === dateKey && stats.played > 0) return stats;
  stats.played += 1;
  if (won) {
    stats.wins += 1;
    stats.streak = stats.lastDate ? consecutive(stats.lastDate, dateKey) ? stats.streak + 1 : 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    const bucket = Math.min(6, Math.max(1, guesses)) - 1;
    stats.dist[bucket] = (stats.dist[bucket] ?? 0) + 1;
  } else {
    stats.streak = 0;
    stats.dist[6] = (stats.dist[6] ?? 0) + 1;
  }
  stats.lastDate = dateKey;
  saveStats(mode, stats);
  return stats;
}

function consecutive(prev: string, next: string): boolean {
  const [py, pm, pd] = prev.split("-").map(Number);
  const [ny, nm, nd] = next.split("-").map(Number);
  const a = Date.UTC(py!, (pm ?? 1) - 1, pd ?? 1);
  const b = Date.UTC(ny!, (nm ?? 1) - 1, nd ?? 1);
  return b - a === 86_400_000;
}

export function loadDaily<T extends EkiState | MojiState>(
  mode: "eki" | "moji",
  dateKey: string,
): T | null {
  const raw = read(`${PREFIX}daily:${mode}:${dateKey}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveDaily(mode: "eki" | "moji", state: EkiState | MojiState): void {
  if (state.kind !== "daily") return;
  localStorage.setItem(`${PREFIX}daily:${mode}:${state.dateKey}`, JSON.stringify(state));
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
