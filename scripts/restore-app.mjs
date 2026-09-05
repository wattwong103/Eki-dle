#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");
const parts = ["app.ts.gz.b64.p0","app.ts.gz.b64.p1"];
const b64 = parts.map((p) => readFileSync(path.join(dir, p), "utf8")).join("");
const buf = gunzipSync(Buffer.from(b64, "base64"));
writeFileSync(path.join(root, "src/app.ts"), buf);
console.log("wrote src/app.ts", buf.length);
