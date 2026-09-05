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

export { boot } from "./app-boot";
