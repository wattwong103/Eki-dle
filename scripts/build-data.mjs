#!/usr/bin/env node
/**
 * Download 駅メモ-aligned station/line CSVs (CC BY 4.0, Seo-4d696b75/station_database)
 * and emit compact JSON for the game.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "public", "data");
const TAG = "v20260831";
const BASE = `https://cdn.jsdelivr.net/gh/Seo-4d696b75/station_database@${TAG}/out/main`;

const FILES = {
  stations: "station.csv",
  lines: "line.csv",
  register: "register.csv",
};

async function download(name) {
  await mkdir(RAW, { recursive: true });
  const dest = path.join(RAW, name);
  if (existsSync(dest)) {
    console.log(`cached ${name}`);
    return readFile(dest, "utf8");
  }
  const url = `${BASE}/${name}`;
  console.log(`fetch ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const text = await res.text();
  await writeFile(dest, text);
  return text;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let i = 0;
  let quoted = false;
  const s = text.replace(/^\uFEFF/, "");
  while (i < s.length) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        quoted = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    cell += ch;
    i++;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r[0] && r[0].length));
}

const YOUON = {
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
  ぎゃ: "gya",
  ぎゅ: "gyu",
  ぎょ: "gyo",
  じゃ: "ja",
  じゅ: "ju",
  じょ: "jo",
  びゃ: "bya",
  びゅ: "byu",
  びょ: "byo",
  ぴゃ: "pya",
  ぴゅ: "pyu",
  ぴょ: "pyo",
};

const BASIC = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  ゐ: "wi",
  ゑ: "we",
  を: "o",
  ん: "n",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  ぁ: "a",
  ぃ: "i",
  ぅ: "u",
  ぇ: "e",
  ぉ: "o",
  ゃ: "ya",
  ゅ: "yu",
  ょ: "yo",
  ゎ: "wa",
  っ: "tsu",
  ー: "",
  "・": " ",
  "＝": "-",
};

function kanaToRomaji(kana) {
  let s = kana.normalize("NFKC").toLowerCase();
  s = s.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (s[i] === "っ" && i + 1 < s.length) {
      const rest = kanaToRomaji(s.slice(i + 1));
      if (rest.startsWith("ch")) return out + "t" + rest;
      const next = rest[0];
      if (next && /[bcdfghjklmnpqrstvwxyz]/i.test(next)) {
        out += next + rest;
      } else {
        out += "tsu" + rest;
      }
      return out;
    }
    if (YOUON[two]) {
      out += YOUON[two];
      i++;
      continue;
    }
    if (s[i] === "ん") {
      const next = s[i + 1];
      if (next && /[あいうえおやゆよ]/.test(next)) out += "n'";
      else out += "n";
      continue;
    }
    if (s[i] === "ー") {
      const last = out.match(/[aeiou]$/i);
      if (last) out += last[0];
      continue;
    }
    out += BASIC[s[i]] ?? s[i];
  }
  return out
    .replace(/ou/g, "o")
    .replace(/uu/g, "u")
    .replace(/oo/g, "o")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseRomaji(r) {
  return r
    .split(/([\s-])/)
    .map((part) => {
      if (part === " " || part === "-") return part;
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function cleanLineName(name) {
  return name
    .replace(/（.*?）/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/ｊｒ/gi, "JR")
    .trim();
}

const COMPANY = {
  1: "JR北海道",
  2: "JR東日本",
  3: "JR東海",
  4: "JR西日本",
  5: "JR四国",
  6: "JR九州",
  11: "東武",
  12: "西武",
  13: "京成",
  14: "京王",
  15: "小田急",
  16: "東急",
  17: "京急",
  18: "東京メトロ",
  19: "相鉄",
  20: "名鉄",
  21: "近鉄",
  22: "南海",
  23: "京阪",
  24: "阪急",
  25: "阪神",
  26: "西鉄",
  101: "札幌市交",
  115: "仙台市交",
  119: "東京都交通局",
  130: "横浜市交",
  179: "名古屋市交",
  195: "京都市交",
  211: "神戸市交",
  249: "Osaka Metro",
};

function moraCount(kana) {
  const s = kana.normalize("NFKC").replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (YOUON[two]) {
      n++;
      i++;
      continue;
    }
    if (s[i] === "ゃ" || s[i] === "ゅ" || s[i] === "ょ") continue;
    if (/[\s・＝]/.test(s[i])) continue;
    n++;
  }
  return n;
}

const PREF_PREFIXES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

function extractCity(address) {
  if (!address) return "";
  let a = address;
  for (const p of PREF_PREFIXES) {
    if (a.startsWith(p)) {
      a = a.slice(p.length);
      break;
    }
  }
  const city = a.match(/([一-龥々ぁ-んァ-ン]{2,8}市)/);
  if (city) return city[1];
  const ku = a.match(/([一-龥々]{1,6}区)/);
  if (ku) return ku[1];
  return "";
}

function toHiraganaChars(kana) {
  return [...kana.normalize("NFKC")]
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 0x30a1 && c <= 0x30f6) return String.fromCharCode(c - 0x60);
      return ch;
    })
    .join("")
    .replace(/[^\u3041-\u3096ー]/g, "");
}

async function main() {
  const [stationText, lineText, registerText] = await Promise.all([
    download(FILES.stations),
    download(FILES.lines),
    download(FILES.register),
  ]);

  const stationRows = parseCSV(stationText);
  const lineRows = parseCSV(lineText);
  const registerRows = parseCSV(registerText);

  const stationHeader = stationRows[0];
  const lineHeader = lineRows[0];
  const regHeader = registerRows[0];
  const si = Object.fromEntries(stationHeader.map((h, i) => [h, i]));
  const li = Object.fromEntries(lineHeader.map((h, i) => [h, i]));
  const ri = Object.fromEntries(regHeader.map((h, i) => [h, i]));

  const linesByCode = new Map();
  const compactLines = [];
  const lineIndexByCode = new Map();

  for (const row of lineRows.slice(1)) {
    const code = Number(row[li.code]);
    const closed = Number(row[li.closed]) === 1;
    const name = row[li.name];
    const company = Number(row[li.company_code] || 0);
    const color = row[li.color] && row[li.color] !== "NULL" ? row[li.color] : "";
    const shinkansen = /新幹線/.test(name);
    const rec = {
      code,
      id: Number(row[li.id]),
      name: cleanLineName(name),
      full: name,
      company,
      companyName: COMPANY[company] || "",
      color,
      closed,
      shinkansen,
    };
    linesByCode.set(code, rec);
  }

  const openLines = [...linesByCode.values()].filter((l) => !l.closed);
  for (const rec of openLines) {
    lineIndexByCode.set(rec.code, compactLines.length);
    compactLines.push({
      id: rec.id,
      n: rec.name,
      co: rec.company,
      cn: rec.companyName,
      col: rec.color,
      sk: rec.shinkansen ? 1 : 0,
    });
  }

  const stationsByCode = new Map();
  for (const row of stationRows.slice(1)) {
    const code = Number(row[si.code]);
    stationsByCode.set(code, {
      code,
      id: Number(row[si.id]),
      name: row[si.name],
      original: row[si.original_name],
      kana: row[si.name_kana],
      lat: Number(row[si.lat]),
      lng: Number(row[si.lng]),
      pref: Number(row[si.prefecture]),
      address: row[si.address] || "",
      open: row[si.open_date] || "",
      closed: Number(row[si.closed]) === 1,
      lineCodes: new Set(),
    });
  }

  for (const row of registerRows.slice(1)) {
    const sc = Number(row[ri.station_code]);
    const lc = Number(row[ri.line_code]);
    const st = stationsByCode.get(sc);
    if (st) st.lineCodes.add(lc);
  }

  const stations = [];
  let skipped = 0;
  for (const st of stationsByCode.values()) {
    if (st.closed) continue;
    if (!Number.isFinite(st.lat) || !Number.isFinite(st.lng)) {
      skipped++;
      continue;
    }
    if (st.lat === 0 && st.lng === 0) {
      skipped++;
      continue;
    }
    const lineIdx = [];
    let shinkansen = false;
    const companies = new Set();
    for (const lc of st.lineCodes) {
      const idx = lineIndexByCode.get(lc);
      if (idx === undefined) continue;
      lineIdx.push(idx);
      const line = compactLines[idx];
      if (line.sk) shinkansen = true;
      if (line.co) companies.add(line.co);
    }
    if (lineIdx.length === 0) {
      skipped++;
      continue;
    }
    const kana = toHiraganaChars(st.kana);
    const romaji = titleCaseRomaji(kanaToRomaji(kana || st.kana));
    const puzzle = lineIdx.length >= 2 || shinkansen;
    const year = st.open && st.open !== "NULL" ? Number(String(st.open).slice(0, 4)) : 0;
    stations.push({
      id: st.id,
      n: st.name,
      o: st.original !== st.name ? st.original : "",
      k: kana,
      r: romaji,
      p: st.pref,
      ct: extractCity(st.address),
      y: Number.isFinite(year) && year > 1800 ? year : 0,
      lat: Math.round(st.lat * 1e6) / 1e6,
      lng: Math.round(st.lng * 1e6) / 1e6,
      l: lineIdx,
      co: [...companies],
      f: (puzzle ? 1 : 0) | (shinkansen ? 2 : 0),
    });
  }

  stations.sort((a, b) => a.id - b.id);

  const puzzleIds = stations.filter((s) => s.f & 1).map((s) => s.id);
  const kana5 = stations.filter((s) => [...s.k].length === 5);
  const kana4 = stations.filter((s) => [...s.k].length === 4);
  const mora4 = stations.filter((s) => moraCount(s.k) === 4);
  const mora5 = stations.filter((s) => moraCount(s.k) === 5);

  const meta = {
    source: "Seo-4d696b75/station_database",
    license: "CC BY 4.0",
    tag: TAG,
    builtAt: new Date().toISOString(),
    stations: stations.length,
    lines: compactLines.length,
    puzzle: puzzleIds.length,
    kana4: kana4.length,
    kana5: kana5.length,
    mora4: mora4.length,
    mora5: mora5.length,
    skipped,
  };

  await mkdir(OUT, { recursive: true });
  const payload = { meta, lines: compactLines, stations };
  const json = JSON.stringify(payload);
  await writeFile(path.join(OUT, "game.json"), json);
  await writeFile(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 2));

  console.log(meta);
  console.log(`wrote ${json.length} bytes to public/data/game.json`);
  console.log("sample", stations.find((s) => s.n === "東京") || stations[0]);
  console.log("kana5 sample", kana5.slice(0, 8).map((s) => `${s.n} ${s.k}`));
  console.log("mora4 sample", mora4.slice(0, 8).map((s) => `${s.n} ${s.k}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
