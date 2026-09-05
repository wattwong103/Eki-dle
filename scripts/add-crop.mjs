import fs from "node:fs";
import path from "node:path";

const [, , idArg, fileArg, hubArg, licenseArg = "CC BY 4.0", sourcePathArg] = process.argv;
if (!idArg || !fileArg || !hubArg) {
  console.error(
    "Usage: node scripts/add-crop.mjs <stationId> <file> <hub> [license] [sourceImagePath]",
  );
  console.error("  If sourceImagePath is provided, copies it into public/data/crops/<file>.");
  console.error("  Otherwise run: npm run generate-crops  (spider SVG from game.json).");
  process.exit(1);
}

const id = Number(idArg);
if (!Number.isInteger(id) || id <= 0) {
  console.error("stationId must be a positive integer");
  process.exit(1);
}

const cropsDir = path.resolve("public/data/crops");
const manifestPath = path.join(cropsDir, "crops.json");
fs.mkdirSync(cropsDir, { recursive: true });

if (sourcePathArg) {
  const src = path.resolve(sourcePathArg);
  if (!fs.existsSync(src) || !fs.statSync(src).isFile()) {
    console.error(`Source image not found: ${src}`);
    process.exit(1);
  }
  const dest = path.join(cropsDir, fileArg);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}

const raw = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : { version: 1, crops: [] };
raw.version = 1;
raw.crops = Array.isArray(raw.crops) ? raw.crops : [];
const next = {
  id,
  file: fileArg,
  hub: hubArg,
  source: "Generated from station_database",
  license: licenseArg,
};
const i = raw.crops.findIndex((x) => x.id === id);
if (i >= 0) raw.crops[i] = next;
else raw.crops.push(next);
raw.crops.sort((a, b) => a.id - b.id);
fs.writeFileSync(manifestPath, `${JSON.stringify(raw, null, 2)}\n`);

const assetPath = path.join(cropsDir, fileArg);
if (!fs.existsSync(assetPath)) {
  console.warn(`Warning: asset missing at ${assetPath}`);
  console.warn("Run: npm run generate-crops");
}
console.log(`Updated ${manifestPath} (${next.id})`);
