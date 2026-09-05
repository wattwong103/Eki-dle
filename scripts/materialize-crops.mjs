#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptsDir = path.join(root, "scripts");
const outDir = path.join(root, "public", "data", "crops");
fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const name of fs.readdirSync(scriptsDir).sort()) {
  if (!/^crop-assets.*\.json$/.test(name)) continue;
  const pack = JSON.parse(fs.readFileSync(path.join(scriptsDir, name), "utf8"));
  for (const [file, b64] of Object.entries(pack)) {
    fs.writeFileSync(path.join(outDir, file), Buffer.from(b64, "base64"));
    n++;
  }
}
if (n) console.log(`materialize-crops: wrote ${n} SVG(s)`);
