#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");

function run(script) {
  const p = path.join(dir, script);
  if (!existsSync(p)) return;
  const r = spawnSync(process.execPath, [p], { stdio: "inherit", cwd: root });
  if (r.status) process.exit(r.status);
}

run("restore-build-data.mjs");
run("restore-app.mjs");

const lineEn = path.join(dir, "build-line-en.mjs");
if (existsSync(lineEn)) {
  const r = spawnSync(process.execPath, [lineEn], { stdio: "inherit", cwd: root });
  if (r.status) process.exit(r.status);
}
