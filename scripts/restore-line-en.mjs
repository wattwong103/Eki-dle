#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");
const outDir = path.join(root, "public", "data");
mkdirSync(outDir, { recursive: true });
const parts = ["line-en.json.b64.p0","line-en.json.b64.p1","line-en.json.b64.p2","line-en.json.b64.p3","line-en.json.b64.p4","line-en.json.b64.p5","line-en.json.b64.p6","line-en.json.b64.p7","line-en.json.b64.p8","line-en.json.b64.p9"];
const b64 = parts.map((p) => readFileSync(path.join(dir, p), "utf8")).join("");
const buf = Buffer.from(b64, "base64");
writeFileSync(path.join(outDir, "line-en.json"), buf);
console.log("wrote line-en.json", buf.length);
