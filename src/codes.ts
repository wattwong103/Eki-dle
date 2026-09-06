import type { Catalog } from "./catalog";
import { regionName } from "./i18n";
import { operatorName } from "./labels";
import { prefName } from "./prefectures";
import type { Lang, Station } from "./types";

export type CodeHint =
  | { kind: "code"; code: string; color?: string }
  | { kind: "hint"; label: string };

function ownCodeHints(catalog: Catalog, target: Station): CodeHint[] {
  return catalog.codesFor(target).map((x) => {
    const line = catalog.line(x.line);
    const color = line?.col?.trim() || undefined;
    return { kind: "code" as const, code: x.code, color };
  });
}

function textHints(catalog: Catalog, target: Station, lang: Lang): string[] {
  const out: string[] = [];
  const pref = prefName(target.p, lang);
  if (pref) out.push(pref);
  const region = regionName(target.p, lang);
  if (region) out.push(region);
  const ops = [
    ...new Set(
      catalog
        .linesFor(target)
        .map((l) => operatorName(l, lang)?.trim())
        .filter((x): x is string => !!x),
    ),
  ];
  for (const op of ops) out.push(op);
  if (target.y > 0) out.push(String(target.y));
  return out;
}

/** Progressive reveal of the target's own codes, then text hints about the target. */
export function visibleCodes(
  catalog: Catalog,
  target: Station,
  misses: number,
  lang: Lang = "en",
): CodeHint[] {
  const need = Math.max(1, misses + 1);
  const out: CodeHint[] = [];
  const codes = ownCodeHints(catalog, target);
  for (const c of codes) {
    if (out.length >= need) break;
    out.push(c);
  }
  if (out.length >= need) return out.slice(0, need);

  const seen = new Set(out.filter((x) => x.kind === "hint").map((x) => x.label));
  for (const label of textHints(catalog, target, lang)) {
    if (out.length >= need) break;
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ kind: "hint", label });
  }
  return out.slice(0, need);
}
