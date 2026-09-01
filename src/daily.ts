const EPOCH = Date.UTC(2026, 0, 1);

export function jstDateKey(now = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 3_600_000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function puzzleNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = Date.UTC(y!, (m ?? 1) - 1, d ?? 1);
  return Math.floor((t - EPOCH) / 86_400_000) + 1;
}

export function nextJstMidnightMs(now = new Date()): number {
  const shift = 9 * 3_600_000;
  const shifted = now.getTime() + shift;
  const nextDay = Math.floor(shifted / 86_400_000) + 1;
  return nextDay * 86_400_000 - shift;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickId(ids: number[], puzzleNo: number, salt: string): number {
  if (ids.length === 0) throw new Error("empty id pool");
  const rng = mulberry32(hashString(`${salt}:${puzzleNo}`));
  const idx = Math.floor(rng() * ids.length);
  return ids[idx]!;
}

export function randomId(ids: number[]): number {
  if (ids.length === 0) throw new Error("empty id pool");
  const rng = mulberry32((Math.random() * 0xffffffff) >>> 0);
  return ids[Math.floor(rng() * ids.length)]!;
}
