import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const packed = path.join(here, "app-src", "app.ts.gz.b64");
const out = path.join(root, "src", "app.ts");

if (!fs.existsSync(packed)) {
  console.error(`Missing ${packed}`);
  process.exit(1);
}

const body = zlib.gunzipSync(Buffer.from(fs.readFileSync(packed, "utf8").trim(), "base64"));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body);
console.log(`Wrote ${out} (${body.length} bytes) from app.ts.gz.b64`);
