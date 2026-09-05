import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dir = path.join(here, "app-src");
const parts = ["part00.b64", "part01.b64", "part02.b64", "part03.b64", "part04.b64"];
const out = path.join(root, "src", "app.ts");
let body = "";
for (const name of parts) {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p}`);
    process.exit(1);
  }
  body += Buffer.from(fs.readFileSync(p, "utf8").trim(), "base64").toString("utf8");
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body);
console.log(`Wrote ${out} (${body.length} bytes) from ${parts.length} b64 parts`);
