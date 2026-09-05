import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dir = path.join(here, "app-src");
const out = path.join(root, "src", "app.ts");

function readPacked() {
  const single = path.join(dir, "app.ts.gz.b64");
  const p0 = path.join(dir, "app.ts.gz.b64.p0");
  const p1 = path.join(dir, "app.ts.gz.b64.p1");
  if (fs.existsSync(p0) && fs.existsSync(p1)) {
    return fs.readFileSync(p0, "utf8").trim() + fs.readFileSync(p1, "utf8").trim();
  }
  if (fs.existsSync(single)) {
    return fs.readFileSync(single, "utf8").trim();
  }
  console.error(`Missing ${single} (or p0/p1 parts)`);
  process.exit(1);
}

const body = zlib.gunzipSync(Buffer.from(readPacked(), "base64"));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body);
console.log(`Wrote ${out} (${body.length} bytes)`);
