import { METROS, stationInMetro, stationInRegionScope } from "./cities";
import { regionOf, type RegionId } from "./prefectures";
import {
  FLAG_PUZZLE,
  FLAG_SHINKANSEN,
  type GameData,
  type Line,
  type Scope,
  type Station,
} from "./types";
import { MOJI_LEN, kanaChars, toHiragana } from "./wordle";

export type LineInfo = {
  index: number;
  line: Line;
  count: number;
  prefs: number[];
  region: RegionId;
};

const EXTRA_PUZZLE_NAMES = new Set([
  "梅田",
  "心斎橋",
  "銀座",
  "表参道",
  "鎌倉",
  "日光",
  "宮島口",
  "太宰府",
  "成田空港",
  "関西空港",
  "中部国際空港",
  "那覇空港",
  "出雲市",
  "伊勢市",
  "高野山",
  "下北沢",
  "吉祥寺",
  "中目黒",
]);

const JR_COS = new Set([1, 2, 3, 4, 5, 6]);

export class Catalog {
  readonly data: GameData;
  readonly byId = new Map<number, Station>();
  readonly puzzleIds: number[];
  readonly codeIds: number[];
  readonly mojiIds: number[];
  readonly mojiKana = new Set<string>();
  readonly lines: LineInfo[];
  readonly rosenIds: number[];
  private readonly searchIndex: { s: Station; blob: string; name: string; kana: string; roma: string }[];
  private readonly lineSearch: { info: LineInfo; name: string; blob: string }[];

  constructor(data: GameData) {
    this.data = data;
    for (const s of data.stations) this.byId.set(s.id, s);

    const counts = data.lines.map(() => 0);
    const prefSets = data.lines.map(() => new Set<number>());
    for (const s of data.stations) {
      for (const idx of s.l) {
        if (counts[idx] === undefined) continue;
        counts[idx]! += 1;
        prefSets[idx]!.add(s.p);
      }
    }
    this.lines = data.lines.map((line, index) => {
      const prefs = [...(prefSets[index] ?? [])].sort((a, b) => a - b);
      const tally = new Map<RegionId, number>();
      for (const p of prefs) {
        const r = regionOf(p);
        tally.set(r, (tally.get(r) ?? 0) + 1);
      }
      let region: RegionId = "kanto";
      let best = -1;
      for (const [r, n] of tally) {
        if (n > best) {
          best = n;
          region = r;
        }
      }
      return { index, line, count: counts[index] ?? 0, prefs, region };
    });
    this.rosenIds = this.lines
      .filter((l) => l.count >= 6 && (l.count >= 10 || l.line.sk || (l.line.co > 0 && l.line.co <= 26)))
      .map((l) => l.index);

    const extra = data.stations
      .filter((s) => EXTRA_PUZZLE_NAMES.has(s.o || s.n) || EXTRA_PUZZLE_NAMES.has(s.n))
      .map((s) => s.id);
    this.puzzleIds = [...new Set([
      ...data.stations.filter((s) => s.f & FLAG_PUZZLE).map((s) => s.id),
      ...extra,
    ])];
    this.codeIds = data.stations
      .filter((s) => codesForStation(s).length >= 1)
      .map((s) => s.id);

    this.mojiIds = data.stations
      .filter((s) => kanaChars(s.k).length === MOJI_LEN)
      .map((s) => s.id);
    for (const id of this.mojiIds) {
      const s = this.byId.get(id);
      if (s) this.mojiKana.add(kanaChars(s.k).join(""));
    }
    this.searchIndex = data.stations.map((s) => {
      const roma = foldRomaji(s.r);
      return {
        s,
        name: s.n.normalize("NFKC"),
        kana: toHiragana(s.k + s.o),
        roma,
        blob: `${s.n}${s.o}${s.k}${s.r}${roma}${s.ct}`.toLowerCase(),
      };
    });
    this.lineSearch = this.lines.map((info) => {
      const l = info.line;
      const roma = foldRomaji(l.r || "");
      return {
        info,
        name: l.n.normalize("NFKC"),
        blob: `${l.n}${l.r || ""}${roma}${l.cn}${l.ce || ""}`.toLowerCase(),
      };
    });
  }

  station(id: number): Station {
    const s = this.byId.get(id);
    if (!s) throw new Error(`unknown station ${id}`);
    return s;
  }

  line(index: number): Line | undefined {
    return this.data.lines[index];
  }

  lineInfo(index: number): LineInfo {
    const info = this.lines[index];
    if (!info) throw new Error(`unknown line ${index}`);
    return info;
  }

  linesFor(s: Station): Line[] {
    return s.l.map((i) => this.data.lines[i]).filter((x): x is Line => !!x);
  }

  stationsOnLine(index: number): Station[] {
    return this.data.stations.filter((s) => s.l.includes(index));
  }

  codesFor(s: Station): { line: number; code: string; order: number }[] {
    return codesForStation(s);
  }

  stationsOnLineSorted(index: number): Station[] {
    const orderOf = (s: Station): number => {
      const c = (s.c ?? []).find((x) => x[0] === index);
      return c ? c[2] : Number.MAX_SAFE_INTEGER;
    };
    return this.stationsOnLine(index).sort((a, b) => orderOf(a) - orderOf(b));
  }

  puzzleIdsFor(scope: Scope): number[] {
    if (scope === "all") return this.puzzleIds;
    const metro = METROS.find((m) => m.id === scope);
    if (metro) {
      const ids = this.data.stations.filter((s) => stationInMetro(s, metro)).map((s) => s.id);
      return ids.length ? ids : this.puzzleIds;
    }
    return this.puzzleIds.filter((id) => {
      const s = this.byId.get(id);
      if (!s) return false;
      if (scope === "shinkansen") return (s.f & FLAG_SHINKANSEN) !== 0;
      if (scope === "jr") return s.co.some((c) => JR_COS.has(c));
      return stationInRegionScope(s, scope);
    });
  }

  searchLines(raw: string, limit = 8): LineInfo[] {
    const q = normalizeQuery(raw);
    if (q.length === 0) return [];
    const qRoma = foldRomaji(q);
    const scored: { info: LineInfo; n: number }[] = [];
    for (const row of this.lineSearch) {
      const l = row.info.line;
      const nameEn = (l.r || "").toLowerCase();
      const ce = (l.ce || "").toLowerCase();
      const cn = (l.cn || "").toLowerCase();
      const roma = foldRomaji(l.r || "");
      let n = 0;
      if (row.name === q || nameEn === q || roma === qRoma) n = 100;
      else if (row.name.startsWith(q) || nameEn.startsWith(q) || (qRoma.length >= 2 && roma.startsWith(qRoma))) n = 80;
      else if (ce === q || cn === q) n = 75;
      else if (ce.startsWith(q) || cn.startsWith(q)) n = 65;
      else if (row.name.includes(q) || nameEn.includes(q) || (qRoma.length >= 3 && roma.includes(qRoma))) n = 50;
      else if (q.length >= 2 && (ce.includes(q) || cn.includes(q) || row.blob.includes(q))) n = 20;
      if (n) scored.push({ info: row.info, n });
    }
    scored.sort((a, b) => b.n - a.n || b.info.count - a.info.count);
    return scored.slice(0, limit).map((x) => x.info);
  }

  search(raw: string, limit = 8): Station[] {
    const q = normalizeQuery(raw);
    if (q.length === 0) return [];
    const qKana = toHiragana(q);
    const qRoma = foldRomaji(q);
    const scored: { s: Station; n: number }[] = [];
    for (const row of this.searchIndex) {
      let n = 0;
      if (row.name === q || row.kana === qKana) n = 100;
      else if (row.name.startsWith(q) || row.kana.startsWith(qKana)) n = 80;
      else if (row.roma.startsWith(qRoma) && qRoma.length >= 2) n = 70;
      else if (row.name.includes(q) || row.kana.includes(qKana)) n = 40;
      else if (qRoma.length >= 3 && row.roma.includes(qRoma)) n = 30;
      else if (q.length >= 2 && row.blob.includes(q)) n = 10;
      if (n) scored.push({ s: row.s, n });
    }
    scored.sort((a, b) => b.n - a.n || b.s.l.length - a.s.l.length);
    const seen = new Set<number>();
    const out: Station[] = [];
    for (const { s } of scored) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      out.push(s);
      if (out.length >= limit) break;
    }
    return out;
  }

  isMojiWord(kana: string): boolean {
    return this.mojiKana.has(kanaChars(kana).join(""));
  }
}

export function codesForStation(s: Station): { line: number; code: string; order: number }[] {
  const raw = s.c ?? [];
  const out: { line: number; code: string; order: number }[] = [];
  for (const [line, code, order] of raw) {
    if (code && code.trim()) out.push({ line, code: code.trim(), order });
  }
  out.sort((a, b) => a.code.localeCompare(b.code));
  return out;
}

export function normalizeQuery(raw: string): string {
  return toHiragana(raw.normalize("NFKC"))
    .replace(/駅$/u, "")
    .replace(/[\s　]+/g, "")
    .trim()
    .toLowerCase();
}

export function foldRomaji(s: string): string {
  return s
    .toLowerCase()
    .replace(/ou/g, "o")
    .replace(/uu/g, "u")
    .replace(/oo/g, "o")
    .replace(/['\-\s]/g, "");
}


/** Merge compact line-en.json {id:{r,ce}} into game lines missing English fields. */
export function applyLineEnLabels(
  data: GameData,
  labels: Record<string, { r?: string; ce?: string }>,
): GameData {
  for (const line of data.lines) {
    const en = labels[String(line.id)];
    if (!en) continue;
    if (!line.r && en.r) line.r = en.r;
    if (!line.ce && en.ce) line.ce = en.ce;
  }
  return data;
}
