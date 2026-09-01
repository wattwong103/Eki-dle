import { FLAG_PUZZLE, type GameData, type Line, type Station } from "./types";
import { MOJI_LEN, kanaChars, toHiragana } from "./wordle";

export class Catalog {
  readonly data: GameData;
  readonly byId = new Map<number, Station>();
  readonly puzzleIds: number[];
  readonly mojiIds: number[];
  readonly mojiKana = new Set<string>();
  private readonly searchIndex: { s: Station; blob: string; name: string; kana: string; roma: string }[];

  constructor(data: GameData) {
    this.data = data;
    for (const s of data.stations) this.byId.set(s.id, s);
    this.puzzleIds = data.stations.filter((s) => s.f & FLAG_PUZZLE).map((s) => s.id);
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
        blob: `${s.n}${s.o}${s.k}${s.r}${roma}`.toLowerCase(),
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

  linesFor(s: Station): Line[] {
    return s.l.map((i) => this.data.lines[i]).filter((x): x is Line => !!x);
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
