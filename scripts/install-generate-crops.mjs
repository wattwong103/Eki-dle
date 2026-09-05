#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url));
const b64 = fs.readFileSync(path.join(dir, "generate-crop-svgs.mjs.b64"), "utf8").trim();
fs.writeFileSync(path.join(dir, "generate-crop-svgs.mjs"), Buffer.from(b64, "base64"));
