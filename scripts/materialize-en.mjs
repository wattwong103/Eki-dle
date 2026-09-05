#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const dir = path.dirname(fileURLToPath(import.meta.url));
for (const name of ["restore-build-data.mjs", "restore-app.mjs", "restore-line-en.mjs"]) {
  const p = path.join(dir, name);
  if (existsSync(p)) spawnSync(process.execPath, [p], { stdio: "inherit" });
}
