import type { Catalog, LineInfo } from "./catalog";
import { t, regionIdName, regionName } from "./i18n";
import { prefName } from "./prefectures";
import type { Lang, Station } from "./types";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export function lineChipHtml(name: string, color: string, extraClass = ""): string {
  const c = color && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : "";
  const style = c ? ` style="--lc:${c}"` : "";
  return `<span class="chip line ${extraClass}"${style}>${esc(name)}</span>`;
}

export function lineRibbonHtml(
  lines: { n: string; col: string }[],
): string {
  if (!lines.length) return "";
  return `<div class="ribbon" aria-hidden="true">${lines
    .map((l) => {
      const c = l.col && /^#[0-9a-fA-F]{3,8}$/.test(l.col) ? l.col : "#667";
      return `<span class="rib" style="background:${c}" title="${esc(l.n)}"></span>`;
    })
    .join("")}</div>`;
}

export function stationDossierHtml(catalog: Catalog, s: Station, lang: Lang): string {
  const L = t(lang);
  const lines = catalog.linesFor(s);
  const ops = [...new Set(lines.map((l) => l.cn).filter(Boolean))];
  const wiki = `https://ja.wikipedia.org/wiki/${encodeURIComponent(`${s.o || s.n}駅`)}`;
  const maps = `https://www.google.com/maps?q=${s.lat},${s.lng}`;
  const lineChips = lines
    .slice(0, 8)
    .map((l) => lineChipHtml(l.n, l.col))
    .join("");
  const more = lines.length > 8 ? `<span class="chip">+${lines.length - 8}</span>` : "";
  const city = s.ct || prefName(s.p, lang);
  const year = s.y ? `${s.y}${lang === "ja" ? "年開業" : " opened"}` : "";
  return `
    <div class="dossier">
      ${lineRibbonHtml(lines)}
      <div class="chips">${lineChips}${more}</div>
      <p class="dossier-meta">${esc(ops.join(" · ") || "—")} · ${esc(city)} · ${esc(prefName(s.p, lang))} · ${esc(regionName(s.p, lang))}</p>
      <p class="dossier-meta">${lines.length}${esc(L.lineUnit)}${year ? ` · ${esc(year)}` : ""}</p>
      <p class="dossier-links">
        <a href="${maps}" target="_blank" rel="noopener">${esc(L.mapLink)}</a>
        <a href="${wiki}" target="_blank" rel="noopener">Wikipedia</a>
      </p>
    </div>`;
}

export function lineDossierHtml(info: LineInfo, lang: Lang): string {
  const L = t(lang);
  const prefs = info.prefs.slice(0, 6).map((p) => prefName(p, lang)).join(" · ");
  const more = info.prefs.length > 6 ? ` +${info.prefs.length - 6}` : "";
  return `
    <div class="dossier">
      <div class="chips">${lineChipHtml(info.line.n, info.line.col, "good")}</div>
      <p class="dossier-meta">${esc(info.line.cn || "—")} · ${esc(regionIdName(info.region, lang))} · ${info.count}${esc(L.stationsUnit)}</p>
      <p class="dossier-meta">${esc(prefs)}${esc(more)}</p>
      ${info.line.sk ? `<p class="dossier-meta">${esc(L.shinkansen)}</p>` : ""}
    </div>`;
}
