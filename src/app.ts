import { Catalog, type LineInfo } from "./catalog";
import { ALL_SCOPES, METROS, cityStripHtml, metroName } from "./cities";
import { lineChipHtml, lineDossierHtml, stationDossierHtml } from "./dossier";
import {
  jstDateKey,
  nextJstMidnightMs,
  pickId,
  puzzleNumber,
  randomId,
} from "./daily";
import { formatKm } from "./geo";
import { regionIdName, regionName, t } from "./i18n";
import { evaluateEki, EKI_MAX, lineChip } from "./eki";
import { evaluateRosen } from "./rosen";
import { copyText, shareCode, shareDiagram, shareEki, shareMap, shareMoji, shareRosen } from "./share";
import { drawJapanMap, drawLineStations, loadJapanRings } from "./map";
import { MAP_ATTRIBUTION, drawMapView } from "./mapview";
import { prefName, type RegionId } from "./prefectures";
import { visibleCodes } from "./codes";
import { cropForId, cropPath, loadCrops, spiderDiagramSvg, type DiagramCrop } from "./crops";
import {
  loadDaily,
  loadSettings,
  loadStats,
  recordFinish,
  saveDaily,
  saveSettings,
} from "./storage";
import {
  applyDakuten,
  applyHandakuten,
  applySmall,
  kanaChars,
  KANA_ROWS,
  MOJI_LEN,
  scoreWordle,
} from "./wordle";
import type {
  EkiState,
  GameData,
  Lang,
  Mode,
  MojiState,
  PlayKind,
  RosenState,
  Scope,
  Settings,
  Station,
  TileKind,
} from "./types";
import "./styles.css";

const SEEN_HELP = "ekidle:v1:seenHelp";

const ICON_STATS = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="4" y="13" width="4" height="7" rx="1"/><rect x="10" y="8" width="4" height="12" rx="1"/><rect x="16" y="4" width="4" height="16" rx="1"/></svg>`;
const ICON_THEME = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg>`;
const ICON_GEAR = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19.4 13a7.7 7.7 0 0 0 .1-1 7.7 7.7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L15 3h-6l-.3 2.6A7 7 0 0 0 7 6.6l-2.4-1-2 3.4 2 1.6a7.7 7.7 0 0 0-.1 1 7.7 7.7 0 0 0 .1 1L.6 14.6l2 3.4 2.4-1a7 7 0 0 0 1.7 1L9 21h6l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.4zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z"/></svg>`;
const ARROW_SVG = `<svg class="arrow-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2 L20.2 21.2 L12 16.4 L3.8 21.2 Z"/></svg>`;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function emptyMoji(partial: Omit<MojiState, "rows" | "letters" | "current" | "status">): MojiState {
  return { ...partial, rows: [], letters: [], current: [], status: "playing" };
}

export async function boot(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app missing");
  const langGuess: Lang = navigator.language.startsWith("ja") ? "ja" : "en";
  root.innerHTML = `<div class="boot"><div class="mark">駅</div><p>${esc(t(langGuess).loading)}</p></div>`;
  try {
    const [gameRes, rings, crops] = await Promise.all([
      fetch("./data/game.json"),
      loadJapanRings(),
      loadCrops().catch(() => [] as DiagramCrop[]),
    ]);
    if (!gameRes.ok) throw new Error(String(gameRes.status));
    const data = (await gameRes.json()) as GameData;
    start(root, new Catalog(data), rings, crops);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="error"><p>${esc(t("en").loadError)}</p></div>`;
  }
}

type Rings = Awaited<ReturnType<typeof loadJapanRings>>;

function start(root: HTMLElement, catalog: Catalog, rings: Rings, crops: DiagramCrop[]): void {
  const settings: Settings = loadSettings();
  let mode: Mode = "eki";
  let play: PlayKind = "daily";
  let eki = restoreEki();
  let moji = restoreMoji();
  let rosen = restoreRosen();
  let mapMode = restoreMap();
  let code = restoreCode();
  let diagram = restoreDiagram();
  let query = "";
  let suggestions: Station[] = [];
  let lineHits: LineInfo[] = [];
  let highlight = 0;
  let alertMsg = "";
  let modal: null | "help" | "stats" | "settings" = null;
  let toast = "";
  let smallOn = false;
  let recorded = {
    eki: eki.status !== "playing",
    moji: moji.status !== "playing",
    rosen: rosen.status !== "playing",
    map: mapMode.status !== "playing",
    code: code.status !== "playing",
    diagram: diagram.status !== "playing",
  };

  applyChrome();
  root.innerHTML = shell();
  bind();
  paint();
  if (!localStorage.getItem(SEEN_HELP)) {
    modal = "help";
    localStorage.setItem(SEEN_HELP, "1");
    paintModal();
  }
  setInterval(() => paintCountdown(), 1000);
  requestAnimationFrame(() => paintMap());

  function applyChrome(): void {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.cb = settings.colorblind ? "true" : "false";
    document.documentElement.lang = settings.lang;
  }

  function restoreEki(): EkiState {
    const dateKey = jstDateKey();
    const saved = loadDaily<EkiState>("eki", dateKey);
    if (saved && saved.targetId && catalog.byId.has(saved.targetId)) return saved;
    return freshEki("daily");
  }

  function restoreMoji(): MojiState {
    const dateKey = jstDateKey();
    const saved = loadDaily<MojiState>("moji", dateKey);
    if (saved && saved.targetId && catalog.byId.has(saved.targetId)) return saved;
    return freshMoji("daily");
  }

  function restoreRosen(): RosenState {
    const dateKey = jstDateKey();
    const saved = loadDaily<RosenState>("rosen", dateKey);
    if (saved && saved.targetIndex !== undefined && catalog.lines[saved.targetIndex]) return saved;
    return freshRosen("daily");
  }

  function restoreMap(): EkiState {
    const dateKey = jstDateKey();
    const saved = loadDaily<EkiState>("map", dateKey);
    if (saved && saved.targetId && catalog.byId.has(saved.targetId)) return saved;
    return freshMap("daily");
  }

  function restoreCode(): EkiState {
    const dateKey = jstDateKey();
    const saved = loadDaily<EkiState>("code", dateKey);
    if (saved && saved.targetId && catalog.byId.has(saved.targetId)) return saved;
    return freshCode("daily");
  }

  function restoreDiagram(): EkiState {
    const dateKey = jstDateKey();
    const saved = loadDaily<EkiState>("diagram", dateKey);
    if (saved && saved.targetId && catalog.byId.has(saved.targetId)) return saved;
    return freshDiagram("daily");
  }

  function freshEki(kind: PlayKind): EkiState {
    const dateKey = jstDateKey();
    const puzzleNo = puzzleNumber(dateKey);
    const pool = kind === "practice" ? catalog.puzzleIdsFor(settings.scope) : catalog.puzzleIds;
    const ids = pool.length ? pool : catalog.puzzleIds;
    const targetId =
      kind === "daily" ? pickId(ids, puzzleNo, "eki") : randomId(ids);
    return { kind, puzzleNo, dateKey, targetId, guesses: [], status: "playing" };
  }

  function freshMoji(kind: PlayKind): MojiState {
    const dateKey = jstDateKey();
    const puzzleNo = puzzleNumber(dateKey);
    const targetId =
      kind === "daily"
        ? pickId(catalog.mojiIds, puzzleNo, "moji")
        : randomId(catalog.mojiIds);
    return emptyMoji({ kind, puzzleNo, dateKey, targetId, length: MOJI_LEN });
  }

  function freshRosen(kind: PlayKind): RosenState {
    const dateKey = jstDateKey();
    const puzzleNo = puzzleNumber(dateKey);
    const targetIndex =
      kind === "daily"
        ? pickId(catalog.rosenIds, puzzleNo, "rosen")
        : randomId(catalog.rosenIds);
    return { kind, puzzleNo, dateKey, targetIndex, guesses: [], status: "playing" };
  }

  function freshMap(kind: PlayKind): EkiState {
    const dateKey = jstDateKey();
    const puzzleNo = puzzleNumber(dateKey);
    const pool = kind === "practice" ? catalog.puzzleIdsFor(settings.scope) : catalog.puzzleIds;
    const ids = pool.length ? pool : catalog.puzzleIds;
    const targetId =
      kind === "daily" ? pickId(ids, puzzleNo, "map") : randomId(ids);
    return { kind, puzzleNo, dateKey, targetId, guesses: [], status: "playing" };
  }

  function freshCode(kind: PlayKind): EkiState {
    const dateKey = jstDateKey();
    const puzzleNo = puzzleNumber(dateKey);
    const ids = catalog.codeIds.length ? catalog.codeIds : catalog.puzzleIds;
    const targetId =
      kind === "daily" ? pickId(ids, puzzleNo, "code") : randomId(ids);
    return { kind, puzzleNo, dateKey, targetId, guesses: [], status: "playing" };
  }

  function freshDiagram(kind: PlayKind): EkiState {
    const dateKey = jstDateKey();
    const puzzleNo = puzzleNumber(dateKey);
    const ids = crops.map((x) => x.id).filter((id) => catalog.byId.has(id));
    const pool = ids.length ? ids : catalog.puzzleIds;
    const targetId =
      kind === "daily" ? pickId(pool, puzzleNo, "diagram") : randomId(pool);
    return { kind, puzzleNo, dateKey, targetId, guesses: [], status: "playing" };
  }

  function i() {
    return t(settings.lang);
  }

  function shell(): string {
    const L = i();
    return `
      <header class="header">
        <div class="wrap">
          <div class="header-row">
            <a class="brand" href="./" data-act="home">
              <span class="brand-eki">駅</span><span class="brand-dle">dle</span>
              <span class="puzzle-no" id="puzzle-no"></span>
            </a>
            <div class="icon-row">
              <button class="icon-btn" data-act="help" title="${esc(L.howTo)}" aria-label="${esc(L.howTo)}">?</button>
              <button class="icon-btn" data-act="stats" title="${esc(L.stats)}" aria-label="${esc(L.stats)}">${ICON_STATS}</button>
              <button class="icon-btn" data-act="theme" title="${esc(L.theme)}" aria-label="${esc(L.theme)}">${ICON_THEME}</button>
              <button class="icon-btn" data-act="settings" title="${esc(L.settings)}" aria-label="${esc(L.settings)}">${ICON_GEAR}</button>
            </div>
          </div>
          <div class="subhead">
            <div class="tabs" role="tablist">
              <button class="tab" data-act="mode-eki" role="tab">${esc(L.eki)}</button>
              <button class="tab" data-act="mode-moji" role="tab">${esc(L.moji)}</button>
              <button class="tab" data-act="mode-rosen" role="tab">${esc(L.rosen)}</button>
              <button class="tab" data-act="mode-map" role="tab">${esc(L.map)}</button>
              <button class="tab" data-act="mode-code" role="tab">${esc(L.code)}</button>
              <button class="tab" data-act="mode-diagram" role="tab">${esc(L.diagram)}</button>
            </div>
            <div class="pills">
              <button class="pill" data-act="play-daily">${esc(L.daily)}</button>
              <button class="pill" data-act="play-practice">${esc(L.practice)}</button>
            </div>
          </div>
        </div>
      </header>
      <div class="wrap">
        <p class="tagline" id="tagline"></p>
        <div class="pills scopes" id="scope-pills" hidden></div>
        <section id="eki-panel">
          <form class="search" id="guess-form" autocomplete="off">
            <input id="guess" name="guess" type="text" enterkeyhint="go" spellcheck="false" />
            <button class="go" type="submit" id="guess-btn"></button>
            <div class="suggest" id="suggest" hidden></div>
          </form>
          <p class="alert" id="alert"></p>
          <p class="remaining" id="remaining-eki"></p>
          <div class="guess-list" id="tickets"></div>
          <div class="map-wrap"><canvas id="map"></canvas></div>
          <p class="footer" id="map-attribution" hidden></p>
          <div class="result" id="code-panel" hidden></div>
          <div class="result" id="diagram-panel" hidden>
            <img id="diagram-img" alt="diagram hint" style="width:100%;border-radius:10px;display:block;" />
            <p class="dossier-meta" id="diagram-meta"></p>
          </div>
          <div id="city-strip"></div>
        </section>
        <section id="moji-panel" hidden>
          <p class="alert" id="moji-alert"></p>
          <p class="remaining" id="remaining-moji"></p>
          <div class="board" id="board"></div>
          <input class="kana-ime" id="kana" maxlength="5" />
          <div class="keyboard" id="keyboard"></div>
        </section>
        <div id="result"></div>
        <p class="footer" id="footer"></p>
      </div>
      <div id="modal-slot"></div>
    `;
  }

  function bind(): void {
    root.addEventListener("click", onClick);
    root.addEventListener("submit", (e) => {
      const form = e.target as HTMLElement;
      if (form.id === "guess-form") {
        e.preventDefault();
        submitEki();
      }
    });
    const guess = document.getElementById("guess") as HTMLInputElement | null;
    guess?.addEventListener("input", () => {
      query = guess.value;
      alertMsg = "";
      highlight = 0;
      if (mode === "rosen") lineHits = catalog.searchLines(query);
      else suggestions = catalog.search(query);
      paintSuggest();
      paintAlert();
    });
    guess?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const n = mode === "rosen" ? lineHits.length : suggestions.length;
        highlight = Math.min(n - 1, highlight + 1);
        paintSuggest();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlight = Math.max(0, highlight - 1);
        paintSuggest();
      } else if (e.key === "Escape") {
        suggestions = [];
        paintSuggest();
      }
    });
    const kana = document.getElementById("kana") as HTMLInputElement | null;
    kana?.addEventListener("input", () => {
      const chars = kanaChars(kana.value).slice(0, MOJI_LEN);
      moji.current = chars;
      kana.value = chars.join("");
      paintBoard();
    });
    kana?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitMoji();
      }
    });
    window.addEventListener("resize", () => paintMap());
  }

  function onClick(e: Event): void {
    const btn = (e.target as HTMLElement).closest("[data-act]") as HTMLElement | null;
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "noop") return;
    if (act === "mode-eki") setMode("eki");
    else if (act === "mode-moji") setMode("moji");
    else if (act === "mode-rosen") setMode("rosen");
    else if (act === "mode-map") setMode("map");
    else if (act === "mode-code") setMode("code");
    else if (act === "mode-diagram") setMode("diagram");
    else if (act === "play-daily") setPlay("daily");
    else if (act === "play-practice") setPlay("practice");
    else if (act?.startsWith("scope-")) {
      const next = act.slice(6) as Scope;
      settings.scope = next;
      saveSettings(settings);
      if (play === "practice" && (mode === "eki" || mode === "map")) {
        if (mode === "eki") eki = freshEki("practice");
        else mapMode = freshMap("practice");
        query = "";
        const input = document.getElementById("guess") as HTMLInputElement | null;
        if (input) input.value = "";
      }
      paint();
    }
    else if (act === "help") openModal("help");
    else if (act === "stats") openModal("stats");
    else if (act === "settings") openModal("settings");
    else if (act === "close") {
      modal = null;
      paintModal();
    }
    else if (act === "theme") {
      settings.theme = settings.theme === "night" ? "day" : "night";
      saveSettings(settings);
      applyChrome();
      paint();
    }
    else if (act === "lang-ja" || act === "lang-en") {
      settings.lang = act === "lang-ja" ? "ja" : "en";
      saveSettings(settings);
      applyChrome();
      paint();
    }
    else if (act === "cb") {
      settings.colorblind = !settings.colorblind;
      saveSettings(settings);
      applyChrome();
      paint();
    }
    else if (act === "pick") {
      const id = Number(btn.dataset.id);
      const s = catalog.byId.get(id);
      if (s) {
        query = settings.lang === "en" ? s.r : s.n;
        const input = document.getElementById("guess") as HTMLInputElement;
        input.value = query;
        suggestions = [];
        paintSuggest();
        submitEki(s);
      }
    }
    else if (act === "pick-line") {
      const idx = Number(btn.dataset.id);
      const info = catalog.lines[idx];
      if (info) {
        query = info.line.n;
        const input = document.getElementById("guess") as HTMLInputElement;
        input.value = query;
        lineHits = [];
        paintSuggest();
        submitRosen(info);
      }
    }
    else if (act === "share") void doShare();
    else if (act === "again") {
      play = "practice";
      if (mode === "eki") {
        eki = freshEki("practice");
        recorded.eki = false;
      } else if (mode === "moji") {
        moji = freshMoji("practice");
        recorded.moji = false;
      } else if (mode === "rosen") {
        rosen = freshRosen("practice");
        recorded.rosen = false;
      } else if (mode === "map") {
        mapMode = freshMap("practice");
        recorded.map = false;
      } else if (mode === "code") {
        code = freshCode("practice");
        recorded.code = false;
      } else {
        diagram = freshDiagram("practice");
        recorded.diagram = false;
      }
      query = "";
      const input = document.getElementById("guess") as HTMLInputElement | null;
      if (input) input.value = "";
      paint();
    }
    else if (act === "k") {
      typeKana(btn.dataset.k ?? "");
    }
    else if (act === "k-bksp") {
      moji.current = moji.current.slice(0, -1);
      syncKanaInput();
      paintBoard();
    }
    else if (act === "k-enter") submitMoji();
    else if (act === "k-small") {
      smallOn = !smallOn;
      paintKeyboard();
    }
    else if (act === "k-dak") modifyLast(applyDakuten);
    else if (act === "k-han") modifyLast(applyHandakuten);
  }

  function typeKana(ch: string): void {
    if (moji.status !== "playing") return;
    if (moji.current.length >= MOJI_LEN) return;
    const glyph = smallOn ? applySmall(ch) : ch;
    moji.current = [...moji.current, glyph];
    smallOn = false;
    syncKanaInput();
    paintBoard();
    paintKeyboard();
  }

  function modifyLast(fn: (ch: string) => string): void {
    const last = moji.current[moji.current.length - 1];
    if (!last) return;
    moji.current = [...moji.current.slice(0, -1), fn(last)];
    syncKanaInput();
    paintBoard();
  }

  function syncKanaInput(): void {
    const kana = document.getElementById("kana") as HTMLInputElement | null;
    if (kana) kana.value = moji.current.join("");
  }

  function setMode(next: Mode): void {
    mode = next;
    alertMsg = "";
    paint();
  }

  function setPlay(next: PlayKind): void {
    play = next;
    if (next === "daily") {
      eki = restoreEki();
      moji = restoreMoji();
      rosen = restoreRosen();
      mapMode = restoreMap();
      code = restoreCode();
      diagram = restoreDiagram();
    } else if (mode === "eki") eki = freshEki("practice");
    else if (mode === "moji") moji = freshMoji("practice");
    else if (mode === "rosen") rosen = freshRosen("practice");
    else if (mode === "map") mapMode = freshMap("practice");
    else if (mode === "code") code = freshCode("practice");
    else diagram = freshDiagram("practice");
    query = "";
    const input = document.getElementById("guess") as HTMLInputElement | null;
    if (input) input.value = "";
    alertMsg = "";
    paint();
  }

  function openModal(which: typeof modal): void {
    modal = which;
    paintModal();
  }

  function currentState(): EkiState | MojiState | RosenState {
    if (mode === "eki") return eki;
    if (mode === "moji") return moji;
    if (mode === "rosen") return rosen;
    if (mode === "map") return mapMode;
    if (mode === "code") return code;
    return diagram;
  }

  function currentStationState(): EkiState {
    if (mode === "eki") return eki;
    if (mode === "map") return mapMode;
    if (mode === "code") return code;
    return diagram;
  }

  function submitEki(picked?: Station): void {
    const L = i();
    if (mode === "moji") return;
    if (mode === "rosen") {
      submitRosen(lineHits[highlight]);
      return;
    }
    const state = currentStationState();
    if (state.status !== "playing") return;
    const input = document.getElementById("guess") as HTMLInputElement;
    const hit =
      picked ??
      suggestions[highlight] ??
      catalog.search(input.value, 1)[0];
    if (!hit) {
      alertMsg = L.invalidStation;
      paintAlert();
      return;
    }
    if (state.guesses.some((g) => g.id === hit.id)) {
      alertMsg = L.alreadyGuessed;
      paintAlert();
      return;
    }
    const target = catalog.station(state.targetId);
    const g = evaluateEki(hit, target);
    state.guesses.push(g);
    if (g.id === target.id) {
      state.status = "won";
      burst();
    } else if (state.guesses.length >= EKI_MAX) {
      state.status = "lost";
    }
    finishIfNeeded(mode, state);
    saveDaily(mode, state);
    query = "";
    input.value = "";
    suggestions = [];
    alertMsg = "";
    paint();
  }

  function submitMoji(): void {
    const L = i();
    if (moji.status !== "playing") return;
    if (moji.current.length !== MOJI_LEN) {
      alertMsg = L.notEnough;
      paintAlert();
      return;
    }
    const word = moji.current.join("");
    if (!catalog.isMojiWord(word)) {
      alertMsg = L.notInDict;
      paintAlert();
      return;
    }
    const target = kanaChars(catalog.station(moji.targetId).k);
    const row = scoreWordle(moji.current, target);
    moji.rows.push(row);
    moji.letters.push(moji.current);
    if (row.every((x) => x === "correct")) {
      moji.status = "won";
      burst();
    } else if (moji.rows.length >= EKI_MAX) {
      moji.status = "lost";
    }
    moji.current = [];
    syncKanaInput();
    finishIfNeeded("moji", moji);
    saveDaily("moji", moji);
    alertMsg = "";
    paint();
  }

  function submitRosen(picked?: LineInfo): void {
    const L = i();
    if (rosen.status !== "playing") return;
    const input = document.getElementById("guess") as HTMLInputElement;
    const hit = picked ?? lineHits[highlight] ?? catalog.searchLines(input.value, 1)[0];
    if (!hit) {
      alertMsg = L.invalidLine;
      paintAlert();
      return;
    }
    if (rosen.guesses.some((g) => g.index === hit.index)) {
      alertMsg = L.alreadyLine;
      paintAlert();
      return;
    }
    const target = catalog.lineInfo(rosen.targetIndex);
    const g = evaluateRosen(hit, target);
    rosen.guesses.push(g);
    if (g.index === target.index) {
      rosen.status = "won";
      burst();
    } else if (rosen.guesses.length >= EKI_MAX) {
      rosen.status = "lost";
    }
    finishIfNeeded("rosen", rosen);
    saveDaily("rosen", rosen);
    query = "";
    input.value = "";
    lineHits = [];
    alertMsg = "";
    paint();
  }

  function finishIfNeeded(which: Mode, state: EkiState | MojiState | RosenState): void {
    if (state.kind !== "daily") return;
    if (state.status === "playing") return;
    if (recorded[which]) return;
    recorded[which] = true;
    const n =
      which === "eki" || which === "map" || which === "code" || which === "diagram"
        ? (state as EkiState).guesses.length
        : which === "moji"
          ? (state as MojiState).rows.length
          : (state as RosenState).guesses.length;
    recordFinish(which, state.dateKey, state.status === "won", n);
  }

  async function doShare(): Promise<void> {
    const L = i();
    const text =
      mode === "eki"
        ? shareEki(eki, settings.lang)
        : mode === "moji"
          ? shareMoji(moji, settings.lang)
          : mode === "rosen"
            ? shareRosen(rosen, settings.lang)
            : mode === "map"
              ? shareMap(mapMode, settings.lang)
              : mode === "code"
                ? shareCode(code, settings.lang)
                : shareDiagram(diagram, settings.lang);
    const ok = await copyText(text);
    toast = ok ? L.shared : L.copiedFail;
    paintResult();
    setTimeout(() => {
      toast = "";
      paintResult();
    }, 1600);
  }

  function paint(): void {
    const L = i();
    const state = currentState();
    const no = document.getElementById("puzzle-no");
    if (no) no.textContent = state.kind === "daily" ? `#${state.puzzleNo}` : L.practice;
    const tag = document.getElementById("tagline");
    if (tag) {
      tag.textContent =
        mode === "rosen"
          ? L.taglineRosen
          : mode === "map"
            ? L.taglineMap
            : mode === "code"
              ? L.taglineCode
              : mode === "diagram"
                ? L.taglineDiagram
                : L.tagline;
    }
    const footer = document.getElementById("footer");
    if (footer) footer.textContent = L.dataCredit;

    root.querySelectorAll(".tab").forEach((el) => {
      const tab = el as HTMLElement;
      tab.setAttribute("aria-selected", String(tab.dataset.act === `mode-${mode}`));
      if (tab.dataset.act === "mode-eki") tab.textContent = L.eki;
      if (tab.dataset.act === "mode-moji") tab.textContent = L.moji;
      if (tab.dataset.act === "mode-rosen") tab.textContent = L.rosen;
      if (tab.dataset.act === "mode-map") tab.textContent = L.map;
      if (tab.dataset.act === "mode-code") tab.textContent = L.code;
      if (tab.dataset.act === "mode-diagram") tab.textContent = L.diagram;
    });
    root.querySelectorAll(".pill").forEach((el) => {
      const p = el as HTMLElement;
      p.setAttribute("aria-selected", String(p.dataset.act === `play-${play}`));
      if (p.dataset.act === "play-daily") p.textContent = L.daily;
      if (p.dataset.act === "play-practice") p.textContent = L.practice;
    });

    const ekiPanel = document.getElementById("eki-panel");
    const mojiPanel = document.getElementById("moji-panel");
    if (ekiPanel) ekiPanel.hidden = mode === "moji";
    if (mojiPanel) mojiPanel.hidden = mode !== "moji";

    const guess = document.getElementById("guess") as HTMLInputElement | null;
    const playingSearch =
      mode === "rosen" ? rosen.status === "playing" : mode === "moji" ? false : currentStationState().status === "playing";
    if (guess) {
      guess.placeholder = mode === "rosen" ? L.guessLinePlaceholder : L.guessPlaceholder;
      guess.disabled = !playingSearch;
    }
    const gbtn = document.getElementById("guess-btn");
    if (gbtn) gbtn.textContent = L.guess;
    const kana = document.getElementById("kana") as HTMLInputElement | null;
    if (kana) {
      kana.placeholder = L.kanaIme;
      kana.disabled = moji.status !== "playing";
    }

    paintScopes();
    paintAlert();
    paintRemaining();
    paintSuggest();
    paintTickets();
    paintBoard();
    paintKeyboard();
    paintResult();
    paintModal();
    paintMap();
    paintCityStrip();
    paintCodePanel();
    paintDiagramPanel();
    paintMapAttribution();
  }

  function paintScopes(): void {
    const box = document.getElementById("scope-pills");
    if (!box) return;
    const show = play === "practice" && (mode === "eki" || mode === "map");
    box.hidden = !show;
    if (!show) return;
    box.innerHTML = ALL_SCOPES.map((id) => {
      const label = scopeLabel(id);
      return `<button class="pill" data-act="scope-${id}" aria-selected="${settings.scope === id}">${esc(label)}</button>`;
    }).join("");
  }

  function scopeLabel(id: Scope): string {
    const L = i();
    if (id === "all") return L.scopeAll;
    if (id === "shinkansen") return L.scopeSk;
    if (id === "jr") return L.scopeJr;
    const metro = METROS.find((m) => m.id === id);
    if (metro) return metroName(metro, settings.lang);
    return regionIdName(id as RegionId, settings.lang);
  }

  function paintAlert(): void {
    const el = document.getElementById(mode === "moji" ? "moji-alert" : "alert");
    if (el) el.textContent = alertMsg;
  }

  function paintRemaining(): void {
    const L = i();
    const used =
      mode === "moji"
        ? moji.rows.length
        : mode === "rosen"
          ? rosen.guesses.length
          : currentStationState().guesses.length;
    const left = Math.max(0, EKI_MAX - used);
    const playing = currentState().status === "playing";
    const text = playing ? `${L.remaining} ${left} ${L.tries}` : "";
    const ekiEl = document.getElementById("remaining-eki");
    const mojiEl = document.getElementById("remaining-moji");
    if (ekiEl) ekiEl.textContent = mode === "moji" ? "" : text;
    if (mojiEl) mojiEl.textContent = mode === "moji" ? text : "";
  }

  function paintSuggest(): void {
    const box = document.getElementById("suggest");
    if (!box) return;
    const playing = currentState().status === "playing";
    if (mode === "rosen") {
      if (!lineHits.length || !playing) {
        box.hidden = true;
        box.innerHTML = "";
        return;
      }
      box.hidden = false;
      const unit = i().stationsUnit;
      box.innerHTML = lineHits
        .map((info, idx) => {
          const sub = `${info.line.cn || "—"} · ${info.count}${unit}`;
          return `<button type="button" data-act="pick-line" data-id="${info.index}" aria-selected="${idx === highlight}">
            <span class="name">${esc(info.line.n)}</span>
            <span class="meta">${esc(sub)}</span>
          </button>`;
        })
        .join("");
      return;
    }
    if (!suggestions.length || !playing || mode === "moji") {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    box.innerHTML = suggestions
      .map((s, i) => {
        const pref = prefName(s.p, settings.lang);
        const sub = `${s.n} · ${s.k} · ${s.r} · ${pref}`;
        return `<button type="button" data-act="pick" data-id="${s.id}" aria-selected="${i === highlight}">
          <span class="name">${esc(s.n)}</span>
          <span class="meta">${esc(sub)}</span>
        </button>`;
      })
      .join("");
  }

  function paintTickets(): void {
    const box = document.getElementById("tickets");
    if (!box) return;
    const L = i();
    if (mode === "moji") {
      box.innerHTML = "";
      return;
    }
    if (mode === "rosen") {
      const target = catalog.lineInfo(rosen.targetIndex);
      box.innerHTML = [...rosen.guesses].reverse().map((g) => {
        const info = catalog.lineInfo(g.index);
        const win = g.index === target.index;
        const countLabel =
          g.countDelta === 0
            ? L.sameCount
            : g.countDelta > 0
              ? `+${g.countDelta} · ${L.moreStations}`
              : `${g.countDelta} · ${L.fewerStations}`;
        const prefs = g.sharedPrefs.slice(0, 3).map((p) => prefName(p, settings.lang));
        return `<article class="ticket ${g.sameRegion ? "pref-same" : g.sharedPrefs.length ? "pref-near" : "pref-far"} ${win ? "is-win" : ""}">
          <div class="ticket-top">
            <div>
              <span class="st-name">${esc(info.line.n)}</span>
            </div>
          </div>
          <div class="chips">
            <span class="chip ${g.sameCompany ? "good" : ""}">${esc(info.line.cn || "—")}</span>
            <span class="chip ${g.sameRegion ? "good" : ""}">${esc(regionIdName(info.region, settings.lang))}</span>
            <span class="chip">${info.count}${esc(L.stationsUnit)}</span>
            ${
              prefs.length
                ? `<span class="chip close">${esc(prefs.join(" · "))}</span>`
                : `<span class="chip">${esc(L.noSharedPrefs)}</span>`
            }
            ${info.line.sk ? `<span class="chip ${target.line.sk ? "good" : ""}">${esc(L.shinkansen)}</span>` : ""}
          </div>
          <div class="metrics">
            <div class="km">${esc(countLabel)}</div>
          </div>
        </article>`;
      }).join("");
      return;
    }
    const stationState = currentStationState();
    const target = catalog.station(stationState.targetId);
    box.innerHTML = [...stationState.guesses].reverse().map((g) => {
      const s = catalog.station(g.id);
      const win = g.id === target.id;
      const lc = lineChip(g);
      const shared = g.sharedLines
        .map((idx) => catalog.line(idx))
        .filter((x): x is NonNullable<typeof x> => !!x)
        .slice(0, 4);
      return `<article class="ticket pref-${g.pref} ${win ? "is-win" : ""}">
        <div class="ticket-top">
          <div>
            <span class="st-name">${esc(s.n)}</span>
            <span class="st-roma">${esc(s.r)}</span>
          </div>
        </div>
        <div class="chips">
          <span class="chip chip-pref ${g.pref === "same" ? "good" : g.pref === "near" ? "close" : ""}">${esc(prefName(s.p, settings.lang))}</span>
          ${s.ct ? `<span class="chip ${g.sameCity ? "good" : ""}">${esc(s.ct)}</span>` : ""}
          <span class="chip ${g.sameRegion ? "good" : ""}">${esc(regionName(s.p, settings.lang))}</span>
          ${
            shared.length
              ? shared.map((ln) => lineChipHtml(ln.n, ln.col, "good")).join("")
              : `<span class="chip ${lc === "present" ? "close" : ""}">${esc(lc === "present" ? L.sameCompany : L.noSharedLines)}</span>`
          }
        </div>
        <div class="metrics">
          <div class="km">${win ? "0 km" : esc(formatKm(g.km, settings.lang))}</div>
          <div class="arrow" style="transform:rotate(${g.bearing}deg)" title="${g.compass}">${win ? "🎉" : ARROW_SVG}</div>
          <div class="prox">
            <div class="prox-bar"><span style="width:${g.proximity}%"></span></div>
            <div class="prox-lab">${g.proximity}%</div>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  function paintBoard(): void {
    const board = document.getElementById("board");
    if (!board) return;
    const rows: string[] = [];
    for (let r = 0; r < EKI_MAX; r++) {
      const scored = moji.rows[r];
      const letters = moji.letters[r];
      const isCurrent = r === moji.rows.length && moji.status === "playing";
      const cells = [];
      for (let c = 0; c < MOJI_LEN; c++) {
        let kind: TileKind = "empty";
        let ch = "";
        if (scored && letters) {
          kind = scored[c] ?? "absent";
          ch = letters[c] ?? "";
        } else if (isCurrent) {
          ch = moji.current[c] ?? "";
          kind = ch ? "empty" : "empty";
        }
        const filled = ch && kind === "empty" ? "filled" : "";
        cells.push(`<div class="tile ${kind} ${filled}">${esc(ch)}</div>`);
      }
      rows.push(`<div class="row">${cells.join("")}</div>`);
    }
    board.innerHTML = rows.join("");
  }

  function keyColor(ch: string): TileKind | "" {
    let best: TileKind | "" = "";
    moji.rows.forEach((row, ri) => {
      const letters = moji.letters[ri] ?? [];
      letters.forEach((l, i) => {
        if (l !== ch) return;
        const k = row[i] ?? "absent";
        if (k === "correct") best = "correct";
        else if (k === "present" && best !== "correct") best = "present";
        else if (!best) best = "absent";
      });
    });
    return best;
  }

  function paintKeyboard(): void {
    const kb = document.getElementById("keyboard");
    if (!kb) return;
    const L = i();
    const playing = moji.status === "playing";
    const rows = KANA_ROWS.map((row) => {
      const keys = row.map((ch) => {
        if (!ch) return `<span style="width:14px"></span>`;
        const col = keyColor(ch);
        return `<button type="button" class="key ${col}" data-act="k" data-k="${ch}" ${playing ? "" : "disabled"}>${ch}</button>`;
      });
      return `<div class="key-row">${keys.join("")}</div>`;
    });
    rows.push(`<div class="key-row">
      <button type="button" class="key wide" data-act="k-small" ${smallOn ? 'style="background:var(--line);color:#111"' : ""}>${esc(L.small)}</button>
      <button type="button" class="key wide" data-act="k-dak">濁</button>
      <button type="button" class="key wide" data-act="k-han">半</button>
      <button type="button" class="key wide" data-act="k-bksp">${esc(L.backspace)}</button>
      <button type="button" class="key wide" data-act="k-enter">${esc(L.enter)}</button>
    </div>`);
    kb.innerHTML = rows.join("");
  }

  function paintResult(): void {
    const box = document.getElementById("result");
    if (!box) return;
    const state = currentState();
    if (state.status === "playing") {
      box.innerHTML = play === "practice" ? `<p class="countdown">${esc(i().practiceHint)}</p>` : `<p class="countdown" id="countdown"></p>`;
      paintCountdown();
      return;
    }
    const L = i();
    const n =
      mode === "moji"
        ? moji.rows.length
        : mode === "rosen"
          ? rosen.guesses.length
          : currentStationState().guesses.length;
    const title = state.status === "won" ? L.won : L.lost;
    const sub = state.status === "won" ? L.wonIn(n) : L.lostAfter(n);
    const again = play === "practice" || state.kind === "practice";
    let identity = "";
    let dossier = "";
    if (mode === "rosen") {
      const info = catalog.lineInfo(rosen.targetIndex);
      identity = `<p class="answer-name">${esc(info.line.n)}</p>`;
      dossier = lineDossierHtml(info, settings.lang);
    } else {
      const target = catalog.station(mode === "moji" ? (state as MojiState).targetId : currentStationState().targetId);
      identity = `<p class="answer-name">${esc(target.n)}</p>
        <p>${esc(target.k)} · ${esc(target.r)} · ${esc(prefName(target.p, settings.lang))}</p>`;
      dossier = stationDossierHtml(catalog, target, settings.lang);
    }
    box.innerHTML = `<div class="result ${state.status}">
      <h2>${esc(title)}</h2>
      <p>${esc(sub)}</p>
      ${identity}
      ${dossier}
      <div class="actions">
        <button class="btn primary" data-act="share">${esc(toast || L.share)}</button>
        ${again ? `<button class="btn" data-act="again">${esc(mode === "rosen" ? L.playAgainLine : L.playAgain)}</button>` : ""}
      </div>
      ${state.kind === "daily" ? `<p class="countdown" id="countdown"></p>` : ""}
    </div>`;
    paintCountdown();
  }

  function paintCountdown(): void {
    const el = document.getElementById("countdown");
    if (!el) return;
    const L = i();
    const ms = Math.max(0, nextJstMidnightMs() - Date.now());
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    const clock = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
    el.textContent = `${L.nextPuzzle} ${clock}`;
  }

  function paintMap(): void {
    const canvas = document.getElementById("map") as HTMLCanvasElement | null;
    if (!canvas || mode === "moji") return;
    const mapWrap = canvas.closest(".map-wrap") as HTMLElement | null;
    if (mapWrap) mapWrap.hidden = mode === "diagram";
    if (mode === "rosen") {
      const reveal = rosen.status !== "playing";
      const info = catalog.lineInfo(rosen.targetIndex);
      if (reveal) {
        drawLineStations(canvas, rings, catalog.stationsOnLine(info.index), info.line.col);
      } else {
        drawJapanMap(canvas, rings, catalog, [], null, false, settings.lang);
      }
      return;
    }
    const stationState = currentStationState();
    const target = catalog.station(stationState.targetId);
    if (mode === "map") {
      void drawMapView(canvas, target);
      return;
    }
    drawJapanMap(canvas, rings, catalog, stationState.guesses, target, stationState.status !== "playing", settings.lang);
  }

  function paintCityStrip(): void {
    const box = document.getElementById("city-strip");
    if (!box) return;
    if (mode === "moji" || mode === "rosen" || mode === "diagram") {
      box.innerHTML = "";
      return;
    }
    const stationState = currentStationState();
    const last = stationState.guesses.length ? catalog.station(stationState.guesses[stationState.guesses.length - 1]!.id) : null;
    const target = catalog.station(stationState.targetId);
    box.innerHTML = cityStripHtml(last, target, stationState.status !== "playing", settings.lang);
  }

  function paintMapAttribution(): void {
    const el = document.getElementById("map-attribution");
    if (!el) return;
    el.hidden = mode !== "map";
    if (mode === "map") el.textContent = `${i().mapAttribution} (${MAP_ATTRIBUTION})`;
  }

  function paintCodePanel(): void {
    const el = document.getElementById("code-panel");
    if (!el) return;
    if (mode !== "code") {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    const L = i();
    const target = catalog.station(code.targetId);
    const shown = visibleCodes(catalog, target, code.guesses.length, settings.lang).slice(0, EKI_MAX);
    const chips = shown
      .map((x) => {
        if (x.kind === "code") {
          const style = x.color ? ` style="--lc:${esc(x.color)}"` : "";
          return `<span class="chip line good"${style}>${esc(x.code)}</span>`;
        }
        return `<span class="chip">${esc(x.label)}</span>`;
      })
      .join("");
    el.hidden = false;
    el.innerHTML = `<h3>${esc(L.codeHints)} (${shown.length})</h3><div class="chips">${chips}</div>`;
  }

  function paintDiagramPanel(): void {
    const box = document.getElementById("diagram-panel");
    const img = document.getElementById("diagram-img") as HTMLImageElement | null;
    const meta = document.getElementById("diagram-meta");
    if (!box || !img || !meta) return;
    if (mode !== "diagram") {
      box.hidden = true;
      return;
    }
    const L = i();
    const crop = cropForId(crops, diagram.targetId);
    const target = catalog.station(diagram.targetId);
    const fallback = spiderDiagramSvg(catalog, target);
    img.src = crop ? cropPath(crop) : fallback;
    img.onerror = () => {
      if (img.src !== fallback) img.src = fallback;
    };
    meta.textContent = crop ? `${L.diagramHints}: ${crop.hub}` : L.noDiagramCrop;
    box.hidden = false;
  }

  function paintModal(): void {
    const slot = document.getElementById("modal-slot");
    if (!slot) return;
    if (!modal) {
      slot.innerHTML = "";
      return;
    }
    const L = i();
    let body = "";
    if (modal === "help") {
      body = `
        <h2>${esc(L.howTo)}</h2>
        <h3>${esc(L.helpEkiTitle)}</h3>
        <p>${esc(L.helpEki)}</p>
        <div class="legend">
          <span class="swatch"><i class="g"></i>${esc(L.samePref)}</span>
          <span class="swatch"><i class="y"></i>${esc(L.nearPref)}</span>
          <span class="swatch"><i class="x"></i>${esc(L.farPref)}</span>
        </div>
        <h3>${esc(L.helpMojiTitle)}</h3>
        <p>${esc(L.helpMoji)}</p>
        <h3>${esc(L.helpRosenTitle)}</h3>
        <p>${esc(L.helpRosen)}</p>
        <h3>${esc(L.helpMapTitle)}</h3>
        <p>${esc(L.helpMap)}</p>
        <h3>${esc(L.helpCodeTitle)}</h3>
        <p>${esc(L.helpCode)}</p>
        <h3>${esc(L.helpDiagramTitle)}</h3>
        <p>${esc(L.helpDiagram)}</p>
        <p>${esc(L.helpDaily)}</p>
      `;
    } else if (modal === "stats") {
      const st = loadStats(mode);
      const rate = st.played ? Math.round((st.wins / st.played) * 100) : 0;
      const max = Math.max(1, ...st.dist);
      const dist = st.dist
        .map((n, i) => {
          const label = i === 6 ? L.fail : String(i + 1);
          const w = Math.round((n / max) * 100);
          return `<div class="dist-row"><span>${esc(label)}</span><div class="dist-bar" style="width:${w}%"></div><span>${n}</span></div>`;
        })
        .join("");
      body = `
        <h2>${esc(L.stats)} · ${esc(mode === "eki" ? L.eki : mode === "moji" ? L.moji : mode === "rosen" ? L.rosen : mode === "map" ? L.map : mode === "code" ? L.code : L.diagram)}</h2>
        <div class="stat-grid">
          <div><b>${st.played}</b><span>${esc(L.played)}</span></div>
          <div><b>${rate}</b><span>${esc(L.winRate)}</span></div>
          <div><b>${st.streak}</b><span>${esc(L.streak)}</span></div>
          <div><b>${st.maxStreak}</b><span>${esc(L.maxStreak)}</span></div>
        </div>
        <h3>${esc(L.distTitle)}</h3>
        <div class="dist">${dist}</div>
      `;
    } else {
      body = `
        <h2>${esc(L.settings)}</h2>
        <div class="setting-row">
          <span>${esc(L.language)}</span>
          <div class="toggle">
            <button class="btn" data-act="lang-ja" ${settings.lang === "ja" ? 'style="background:var(--accent);color:#fff"' : ""}>日本語</button>
            <button class="btn" data-act="lang-en" ${settings.lang === "en" ? 'style="background:var(--accent);color:#fff"' : ""}>English</button>
          </div>
        </div>
        <div class="setting-row">
          <span>${esc(L.theme)}</span>
          <button class="btn" data-act="theme">${esc(settings.theme === "night" ? L.night : L.day)}</button>
        </div>
        <div class="setting-row">
          <span>${esc(L.colorblind)}</span>
          <button class="btn" data-act="cb">${settings.colorblind ? "ON" : "OFF"}</button>
        </div>
        <p>${esc(L.scopeHint)}</p>
        <p>${esc(L.dataCredit)}</p>
      `;
    }
    slot.innerHTML = `<div class="modal-back" data-act="close"><div class="modal" data-act="noop">${body}
      <div class="actions"><button class="btn primary" data-act="close">${esc(L.close)}</button></div>
    </div></div>`;
  }

  function burst(): void {
    const layer = document.getElementById("burst");
    if (!layer) return;
    const glyphs = ["🚉", "🎫", "🚄", "🚃", "✨"];
    layer.innerHTML = "";
    for (let i = 0; i < 18; i++) {
      const span = document.createElement("span");
      span.textContent = glyphs[i % glyphs.length]!;
      const dx = (Math.random() - 0.5) * 280;
      const dy = -80 - Math.random() * 180;
      const rot = `${(Math.random() - 0.5) * 220}deg`;
      span.style.setProperty("--dx", `${dx}px`);
      span.style.setProperty("--dy", `${dy}px`);
      span.style.setProperty("--rot", rot);
      layer.appendChild(span);
    }
    setTimeout(() => {
      layer.innerHTML = "";
    }, 1200);
  }
}
