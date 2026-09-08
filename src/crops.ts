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

const SCHEMATIC_W = 960;
const SCHEMATIC_H = 540;
const SCHEMATIC_PAD = 64;
const SCHEMATIC_NEIGHBORS = 2;
const SCHEMATIC_MAX_LINES = 8;
const SCHEMATIC_MIN_SPAN = 0.002;

function relativeXY(s: Station, origin: Station): [number, number] {
  const cos = Math.cos((origin.lat * Math.PI) / 180);
  const x = (s.lng - origin.lng) * cos;
  const y = origin.lat - s.lat;
  return [x, y];
}

function project(
  s: Station,
  origin: Station,
  scale: number,
  w = SCHEMATIC_W,
  h = SCHEMATIC_H,
): [number, number] {
  const [x, y] = relativeXY(s, origin);
  return [w / 2 + x * scale, h / 2 + y * scale];
}

/** Neighbor slices (±2) per line through the target, for the geo schematic. */
export function schematicSequences(
  catalog: Catalog,
  station: Station,
  neighbors = SCHEMATIC_NEIGHBORS,
  maxLines = SCHEMATIC_MAX_LINES,
): { color: string; stations: Station[] }[] {
  const out: { color: string; stations: Station[] }[] = [];
  for (const li of station.l.slice(0, maxLines)) {
    const sorted = catalog.stationsOnLineSorted(li);
    const idx = sorted.findIndex((s) => s.id === station.id);
    if (idx < 0) continue;
    const from = Math.max(0, idx - neighbors);
    const to = Math.min(sorted.length, idx + neighbors + 1);
    const slice = sorted.slice(from, to);
    if (!slice.length) continue;
    const line = catalog.line(li);
    out.push({ color: safeColor(line?.col), stations: slice });
  }
  return out;
}

/** Spoiler-safe geographic schematic: real neighbor lat/lng, no names. Target pinned at center. */
export function spiderDiagramSvg(catalog: Catalog, station: Station): string {
  const W = SCHEMATIC_W;
  const H = SCHEMATIC_H;
  const sequences = schematicSequences(catalog, station);
  const seen = new Map<number, Station>();
  seen.set(station.id, station);
  for (const seq of sequences) {
    for (const s of seq.stations) seen.set(s.id, s);
  }

  let maxR = 0;
  for (const s of seen.values()) {
    const [x, y] = relativeXY(s, station);
    maxR = Math.max(maxR, Math.hypot(x, y));
  }
  const budget = Math.min(W, H) / 2 - SCHEMATIC_PAD;
  const scale = budget / Math.max(maxR, SCHEMATIC_MIN_SPAN);

  const parts: string[] = [];
  parts.push(`<rect width='${W}' height='${H}' fill='#f3efe6'/>`);
  parts.push(
    `<rect x='24' y='24' width='${W - 48}' height='${H - 48}' rx='18' fill='#fff' stroke='#ddd' stroke-width='2'/>`,
  );

  for (const seq of sequences) {
    if (seq.stations.length < 2) continue;
    const color = escapeXml(seq.color);
    const pts = seq.stations
      .map((s) => {
        const [x, y] = project(s, station, scale);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    parts.push(
      `<polyline points='${pts}' fill='none' stroke='${color}' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/>`,
    );
  }

  for (const seq of sequences) {
    const color = escapeXml(seq.color);
    for (const s of seq.stations) {
      if (s.id === station.id) continue;
      const [x, y] = project(s, station, scale);
      parts.push(
        `<circle cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' r='8' fill='#fff' stroke='${color}' stroke-width='3'/>`,
      );
    }
  }

  const cx = W / 2;
  const cy = H / 2;
  parts.push(`<circle cx='${cx}' cy='${cy}' r='16' fill='#fff' stroke='#222' stroke-width='5'/>`);
  parts.push(
    `<rect x='${cx - 78}' y='${cy - 22}' width='156' height='44' rx='10' fill='#1a1f24' opacity='0.92'/>`,
  );
  parts.push(
    `<text x='${cx}' y='${cy + 7}' text-anchor='middle' font-family='sans-serif' font-size='20' font-weight='700' fill='#f3efe6'>???</text>`,
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
