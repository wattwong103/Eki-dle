#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "scripts/app-src");
const parts = fs
  .readdirSync(dir)
  .filter((f) => f.startsWith("app.ts.gz.b64.p"))
  .sort((a, b) => {
    const na = Number(a.replace(/.*p/, ""));
    const nb = Number(b.replace(/.*p/, ""));
    return na - nb;
  });
if (!parts.length) throw new Error("no app-src parts");
const b64 = parts.map((f) => fs.readFileSync(path.join(dir, f), "utf8").trim()).join("");
const gz = Buffer.from(b64, "base64");
const body = zlib.gunzipSync(gz);
const out = path.join(root, "src/app.ts");
fs.writeFileSync(out, body);
console.log("wrote", out, body.length, "from", parts.length, "parts");
