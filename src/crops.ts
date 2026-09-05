import type { Catalog } from "./catalog";
import type { Station } from "./types";

export interface DiagramCrop {
  id: number;
  file: string;
  hub: string;
  license?: string;
  source?: string;
}

export interface DiagramManifest {
  version: 1;
  crops: DiagramCrop[];
}

export function parseCropsManifest(raw: unknown): DiagramCrop[] {
  if (!raw || typeof raw !== "object") return [];
  const list = (raw as { crops?: unknown }).crops;
  if (!Array.isArray(list)) return [];
  const out: DiagramCrop[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<DiagramCrop>;
    if (typeof item.id !== "number" || !Number.isFinite(item.id)) continue;
    if (typeof item.file !== "string" || !item.file.trim()) continue;
    if (typeof item.hub !== "string" || !item.hub.trim()) continue;
    out.push({
      id: item.id,
      file: item.file.trim(),
      hub: item.hub.trim(),
      license: typeof item.license === "string" ? item.license : undefined,
      source: typeof item.source === "string" ? item.source : undefined,
    });
  }
  return out;
}

export async function loadCrops(): Promise<DiagramCrop[]> {
  const res = await fetch("./data/crops/crops.json");
  if (!res.ok) return [];
  return parseCropsManifest(await res.json());
}

export function cropForId(crops: DiagramCrop[], id: number): DiagramCrop | undefined {
  return crops.find((x) => x.id === id);
}

export function cropPath(crop: DiagramCrop): string {
  return `./data/crops/${crop.file}`;
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

function safeColor(col: string | undefined): string {
  const c = (col ?? "").trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : "#334455";
}

/** Spoiler-safe spider/route diagram from catalog geometry (no station name/kana/romaji). */
export function spiderDiagramSvg(catalog: Catalog, station: Station): string {
  const W = 960;
  const H = 540;
  const cx = W / 2;
  const cy = H / 2;
  const lineIdxs = station.l.slice(0, 8);
  const n = Math.max(lineIdxs.length, 1);
  const parts: string[] = [];
  parts.push(`<rect width='${W}' height='${H}' fill='#f3efe6'/>`);
  parts.push(
    `<rect x='24' y='24' width='${W - 48}' height='${H - 48}' rx='18' fill='#fff' stroke='#ddd' stroke-width='2'/>`,
  );

  lineIdxs.forEach((li, i) => {
    const line = catalog.line(li);
    const color = escapeXml(safeColor(line?.col));
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const sorted = catalog.stationsOnLineSorted(li);
    const idx = sorted.findIndex((s) => s.id === station.id);
    const before = idx >= 0 ? Math.min(idx, 4) : 3;
    const after = idx >= 0 ? Math.min(Math.max(sorted.length - 1 - idx, 0), 4) : 3;
    const len = 210;
    const scale = Math.max(Math.max(before, after), 1);
    const x1 = cx - Math.cos(angle) * len * (before / scale);
    const y1 = cy - Math.sin(angle) * len * (before / scale);
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;
    parts.push(
      `<line x1='${x1.toFixed(1)}' y1='${y1.toFixed(1)}' x2='${x2.toFixed(1)}' y2='${y2.toFixed(1)}' stroke='${color}' stroke-width='12' stroke-linecap='round'/>`,
    );
    for (let k = -before; k <= after; k++) {
      if (k === 0) continue;
      const t = Math.min(Math.abs(k) / scale, 1) * Math.sign(k);
      const x = cx + Math.cos(angle) * len * t;
      const y = cy + Math.sin(angle) * len * t;
      parts.push(
        `<circle cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' r='9' fill='#fff' stroke='${color}' stroke-width='3'/>`,
      );
    }
  });

  parts.push(`<circle cx='${cx}' cy='${cy}' r='16' fill='#fff' stroke='#222' stroke-width='5'/>`);
  parts.push(
    `<rect x='${cx - 78}' y='${cy - 22}' width='156' height='44' rx='10' fill='#1a1f24' opacity='0.92'/>`,
  );
  parts.push(
    `<text x='${cx}' y='${cy + 7}' text-anchor='middle' font-family='sans-serif' font-size='20' font-weight='700' fill='#f3efe6'>???</text>`,
  );
  parts.push(
    `<text x='${cx}' y='${H - 40}' text-anchor='middle' font-family='sans-serif' font-size='14' fill='#888'>${n} lines</text>`,
  );

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>${parts.join("")}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** @deprecated Prefer spiderDiagramSvg(catalog, station). Kept for tests / callers that only need a blank stub. */
export function fallbackDiagramSvg(catalogOrLabel: Catalog | string, station?: Station): string {
  if (typeof catalogOrLabel === "string") {
    // Non-spoiling anonymous stub — never embed the label string.
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'><rect width='960' height='540' fill='#f4f4f4'/><circle cx='480' cy='270' r='18' fill='#fff' stroke='#333' stroke-width='6'/><rect x='402' y='248' width='156' height='44' rx='10' fill='#1a1f24' opacity='0.92'/><text x='480' y='277' text-anchor='middle' font-family='sans-serif' font-size='20' font-weight='700' fill='#f3efe6'>???</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  if (!station) {
    throw new Error("fallbackDiagramSvg requires station when catalog is provided");
  }
  return spiderDiagramSvg(catalogOrLabel, station);
}
