#!/usr/bin/env node
/**
 * Emit public/data/line-en.json { id: { r, ce } } from station_database line.csv.
 * Sidecar for EN-first labels when game.json lacks Line.r / Line.ce.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "public", "data");
const TAG = "v20260831";
const URL = `https://cdn.jsdelivr.net/gh/Seo-4d696b75/station_database@${TAG}/out/main/line.csv`;

const COMPANY_EN = {
  1: "JR Hokkaido", 2: "JR East", 3: "JR Central", 4: "JR West", 5: "JR Shikoku", 6: "JR Kyushu",
  11: "Tobu", 12: "Seibu", 13: "Keisei", 14: "Keio", 15: "Odakyu", 16: "Tokyu", 17: "Keikyu",
  18: "Tokyo Metro", 19: "Sotetsu", 20: "Meitetsu", 21: "Kintetsu", 22: "Nankai", 23: "Keihan",
  24: "Hankyu", 25: "Hanshin", 26: "Nishitetsu",
  101: "Sapporo Municipal", 115: "Sendai Municipal", 119: "Toei", 130: "Yokohama Municipal",
  179: "Nagoya Municipal", 195: "Kyoto Municipal", 211: "Kobe Municipal", 249: "Osaka Metro",
};

const YOUON = {きゃ:"kya",きゅ:"kyu",きょ:"kyo",しゃ:"sha",しゅ:"shu",しょ:"sho",ちゃ:"cha",ちゅ:"chu",ちょ:"cho",にゃ:"nya",にゅ:"nyu",にょ:"nyo",ひゃ:"hya",ひゅ:"hyu",ひょ:"hyo",みゃ:"mya",みゅ:"myu",みょ:"myo",りゃ:"rya",りゅ:"ryu",りょ:"ryo",ぎゃ:"gya",ぎゅ:"gyu",ぎょ:"gyo",じゃ:"ja",じゅ:"ju",じょ:"jo",びゃ:"bya",びゅ:"byu",びょ:"byo",ぴゃ:"pya",ぴゅ:"pyu",ぴょ:"pyo"};
const BASIC = {あ:"a",い:"i",う:"u",え:"e",お:"o",か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",さ:"sa",し:"shi",す:"su",せ:"se",そ:"so",た:"ta",ち:"chi",つ:"tsu",て:"te",と:"to",な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",は:"ha",ひ:"hi",ふ:"fu",へ:"he",ほ:"ho",ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",や:"ya",ゆ:"yu",よ:"yo",ら:"ra",り:"ri",る:"ru",れ:"re",ろ:"ro",わ:"wa",ゐ:"wi",ゑ:"we",を:"o",ん:"n",が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",ざ:"za",じ:"ji",ず:"zu",ぜ:"ze",ぞ:"zo",だ:"da",ぢ:"ji",づ:"zu",で:"de",ど:"do",ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",ぁ:"a",ぃ:"i",ぅ:"u",ぇ:"e",ぉ:"o",ゃ:"ya",ゅ:"yu",ょ:"yo",ゎ:"wa",っ:"tsu",ー:"","・":" ","＝":"-"};

function kanaToRomaji(kana) {
  let s = kana.normalize("NFKC").toLowerCase();
  s = s.replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (s[i] === "っ" && i + 1 < s.length) {
      const rest = kanaToRomaji(s.slice(i + 1));
      if (rest.startsWith("ch")) return out + "t" + rest;
      const next = rest[0];
      if (next && /[bcdfghjklmnpqrstvwxyz]/i.test(next)) out += next + rest;
      else out += "tsu" + rest;
      return out;
    }
    if (YOUON[two]) { out += YOUON[two]; i++; continue; }
    if (s[i] === "ん") { out += s[i + 1] && /[あいうえおやゆよ]/.test(s[i + 1]) ? "n'" : "n"; continue; }
    if (s[i] === "ー") { const last = out.match(/[aeiou]$/i); if (last) out += last[0]; continue; }
    out += BASIC[s[i]] ?? s[i];
  }
  return out.replace(/ou/g, "o").replace(/uu/g, "u").replace(/oo/g, "o").replace(/\s+/g, " ").trim();
}

function titleCaseRomaji(r) {
  return r.split(/([\s-])/).map((part) => {
    if (part === " " || part === "-" || !part) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join("");
}

function lineRomajiFromKana(nameKana) {
  let s = (nameKana || "").normalize("NFKC");
  s = s.replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  let prefix = "";
  if (/^じぇいあーる/.test(s) || /^じえいあーる/.test(s)) {
    prefix = "JR ";
    s = s.replace(/^じぇいあーる|^じえいあーる/, "");
  }
  return (prefix + titleCaseRomaji(kanaToRomaji(s))).replace(/\s+/g, " ").trim();
}

function parseCSV(text) {
  const rows = []; let row = []; let cell = ""; let i = 0; let quoted = false;
  const s = text.replace(/^\uFEFF/, "");
  while (i < s.length) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') { cell += '"'; i += 2; continue; }
      if (ch === '"') { quoted = false; i++; continue; }
      cell += ch; i++; continue;
    }
    if (ch === '"') { quoted = true; i++; continue; }
    if (ch === ",") { row.push(cell); cell = ""; i++; continue; }
    if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; continue; }
    if (ch === "\r") { i++; continue; }
    cell += ch; i++;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r[0] && r[0].length));
}

async function main() {
  await mkdir(RAW, { recursive: true });
  const dest = path.join(RAW, "line.csv");
  let text;
  if (existsSync(dest)) text = await readFile(dest, "utf8");
  else {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`${URL} -> ${res.status}`);
    text = await res.text();
    await writeFile(dest, text);
  }
  const rows = parseCSV(text);
  const h = Object.fromEntries(rows[0].map((x, i) => [x, i]));
  const out = {};
  for (const row of rows.slice(1)) {
    if (Number(row[h.closed]) === 1) continue;
    const id = Number(row[h.id]);
    const co = Number(row[h.company_code] || 0);
    out[String(id)] = {
      r: lineRomajiFromKana(row[h.name_kana] || row[h.name] || ""),
      ce: COMPANY_EN[co] || "",
    };
  }
  await mkdir(OUT, { recursive: true });
  const json = JSON.stringify(out);
  await writeFile(path.join(OUT, "line-en.json"), json);
  console.log(`wrote ${Object.keys(out).length} lines, ${json.length} bytes`);
}

main().catch((e) => { console.error(e); process.exit(1); });
