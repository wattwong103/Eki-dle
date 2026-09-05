import type { Catalog } from "./catalog";
import { regionOf } from "./prefectures";
import type { Station } from "./types";

function stationCodes(catalog: Catalog, station: Station): string[] {
  return catalog.codesFor(station).map((x) => x.code);
}

function pushCodes(out: string[], seen: Set<string>, codes: string[]): void {
  for (const code of codes) {
    if (!seen.has(code)) {
      seen.add(code);
      out.push(code);
    }
  }
}

export function visibleCodes(catalog: Catalog, target: Station, misses: number): string[] {
  const need = Math.max(1, misses + 1);
  const out: string[] = [];
  const seen = new Set<string>();
  pushCodes(out, seen, stationCodes(catalog, target));
  if (out.length >= need) return out.slice(0, need);

  const targetRegion = regionOf(target.p);
  const groups = [
    catalog.data.stations.filter((s) => s.id !== target.id && s.p === target.p),
    catalog.data.stations.filter((s) => s.id !== target.id && regionOf(s.p) === targetRegion && s.p !== target.p),
    catalog.data.stations.filter((s) => s.id !== target.id && s.co.some((co) => target.co.includes(co))),
    target.y > 0 ? catalog.data.stations.filter((s) => s.id !== target.id && s.y === target.y) : [],
  ];

  for (const stations of groups) {
    for (const s of stations) {
      pushCodes(out, seen, stationCodes(catalog, s));
      if (out.length >= need) return out.slice(0, need);
    }
  }
  return out.slice(0, need);
}
