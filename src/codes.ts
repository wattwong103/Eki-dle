import type { Catalog } from "./catalog";
import { operatorName } from "./labels";
import type { Lang, PlayKind, Station } from "./types";

export type CodeHint =
  | { kind: "code"; code: string; color?: string }
  | { kind: "hint"; label: string; color?: string };

export const MIN_CODE_DAILY = 12;

export function resolveCodePool(
  scoped: number[],
  nationwide: number[],
  kind: PlayKind,
  min = MIN_CODE_DAILY,
): { ids: number[]; widened: boolean } {
  if (scoped.length >= min) return { ids: scoped, widened: false };
  if (kind === "practice" && nationwide.length >= min) {
    return { ids: nationwide, widened: true };
  }
  return { ids: [], widened: false };
}

function ownCodeHints(catalog: Catalog, target: Station): CodeHint[] {
  return catalog.codesFor(target).map((x) => {
    const line = catalog.line(x.line);
    const color = line?.col?.trim() || undefined;
    return { kind: "code" as const, code: x.code, color };
  });
}

/** Operators (with a line color), never prefecture / region / year. */
function operatorHints(catalog: Catalog, target: Station, lang: Lang): CodeHint[] {
  const seen = new Set<string>();
  const out: CodeHint[] = [];
  for (const line of catalog.linesFor(target)) {
    const label = operatorName(line, lang)?.trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    const color = line.col?.trim() || undefined;
    out.push({ kind: "hint", label, color });
  }
  return out;
}

/** Progressive reveal of the target's own codes, then operator + line color. */
export function visibleCodes(
  catalog: Catalog,
  target: Station,
  misses: number,
  lang: Lang = "en",
): CodeHint[] {
  const need = Math.max(1, misses + 1);
  const out: CodeHint[] = [];
  for (const c of ownCodeHints(catalog, target)) {
    if (out.length >= need) break;
    out.push(c);
  }
  if (out.length >= need) return out.slice(0, need);
  for (const h of operatorHints(catalog, target, lang)) {
    if (out.length >= need) break;
    out.push(h);
  }
  return out.slice(0, need);
}
