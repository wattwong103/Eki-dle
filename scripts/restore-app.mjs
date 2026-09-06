#!/usr/bin/env node
/**
 * Restore src/app.ts: download pre-EN app from main, apply app.en.patch.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");
const target = path.join(root, "src", "app.ts");
const patchFile = path.join(dir, "app.en.patch");

const url = "https://raw.githubusercontent.com/wattwong103/Eki-dle/main/src/app.ts";
const res = await fetch(url);
if (!res.ok) throw new Error(`fetch main app.ts failed: ${res.status}`);
writeFileSync(target, await res.text());

if (!existsSync(patchFile)) {
  console.log("no app.en.patch; left main app.ts");
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
if (!out.includes("applyLineEnLabels")) {
  console.error("patch applied but applyLineEnLabels missing");
  process.exit(1);
}
console.log("patched src/app.ts", out.length);
