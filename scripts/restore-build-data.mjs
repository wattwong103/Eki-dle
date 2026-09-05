#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const dir = path.dirname(fileURLToPath(import.meta.url));
const parts = ["build-data.b64.p0","build-data.b64.p1","build-data.b64.p2"];
const b64 = parts.map((p) => readFileSync(path.join(dir, p), "utf8")).join("");
writeFileSync(path.join(dir, "build-data.mjs"), Buffer.from(b64, "base64"));
console.log("wrote build-data.mjs", Buffer.from(b64, "base64").length);
