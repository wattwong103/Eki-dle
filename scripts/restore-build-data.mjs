#!/usr/bin/env node
/**
 * Restore scripts/build-data.mjs from main + build-data.en.patch
 * (COMPANY_EN, Line.r/ce, write public/data/line-en.json).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");
const target = path.join(dir, "build-data.mjs");
const patchFile = path.join(dir, "build-data.en.patch");

const url =
  "https://raw.githubusercontent.com/wattwong103/Eki-dle/main/scripts/build-data.mjs";
const res = await fetch(url);
if (!res.ok) throw new Error(`fetch main build-data failed: ${res.status}`);
writeFileSync(target, await res.text());

if (!existsSync(patchFile)) {
  console.log("no patch; left main build-data.mjs");
  process.exit(0);
}

const r = spawnSync("patch", ["-p1", "--batch", "-i", patchFile], {
  cwd: root,
  encoding: "utf8",
});
if (r.status !== 0) {
  console.error(r.stdout, r.stderr);
  process.exit(r.status ?? 1);
}
const out = readFileSync(target, "utf8");
if (!out.includes("COMPANY_EN")) {
  console.error("patch applied but COMPANY_EN missing");
  process.exit(1);
}
console.log("patched build-data.mjs", out.length);
