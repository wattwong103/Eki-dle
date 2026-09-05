#!/usr/bin/env node
/** One-shot: restore build-data.mjs and src/app.ts from b64 parts if present. */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const dir = path.dirname(fileURLToPath(import.meta.url));
if (existsSync(path.join(dir, "restore-build-data.mjs"))) {
  spawnSync(process.execPath, [path.join(dir, "restore-build-data.mjs")], { stdio: "inherit" });
}
if (existsSync(path.join(dir, "restore-app.mjs"))) {
  spawnSync(process.execPath, [path.join(dir, "restore-app.mjs")], { stdio: "inherit" });
}
