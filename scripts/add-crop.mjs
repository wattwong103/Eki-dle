import fs from "node:fs";
import path from "node:path";

const [, , idArg, fileArg, hubArg, licenseArg = "TBD"] = process.argv;
if (!idArg || !fileArg || !hubArg) {
  console.error("Usage: node scripts/add-crop.mjs <stationId> <file> <hub> [license]");
  process.exit(1);
}

const id = Number(idArg);
if (!Number.isInteger(id) || id <= 0) {
  console.error("stationId must be a positive integer");
  process.exit(1);
}

const manifestPath = path.resolve("public/data/crops/crops.json");
const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
raw.version = 1;
raw.crops = Array.isArray(raw.crops) ? raw.crops : [];
const next = { id, file: fileArg, hub: hubArg, license: licenseArg };
const i = raw.crops.findIndex((x) => x.id === id);
if (i >= 0) raw.crops[i] = next;
else raw.crops.push(next);
raw.crops.sort((a, b) => a.id - b.id);
fs.writeFileSync(manifestPath, `${JSON.stringify(raw, null, 2)}\n`);
console.log(`Updated ${manifestPath} (${next.id})`);
