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
    this.lineSearch = this.lines.map((info) => ({
      info,
      name: info.line.n.normalize("NFKC"),
      blob: `${info.line.n}${info.line.cn}`.toLowerCase(),
    }));
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
    const scored: { info: LineInfo; n: number }[] = [];
    for (const row of this.lineSearch) {
      let n = 0;
      if (row.name === q) n = 100;
      else if (row.name.startsWith(q)) n = 80;
      else if (row.name.includes(q)) n = 50;
      else if (q.length >= 2 && row.blob.includes(q)) n = 20;
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
