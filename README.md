# 駅dle — Eki-dle

A daily Japanese railway-station puzzle. Six modes:

| Mode | Summary |
| --- | --- |
| **駅 / Station** | Worldle-style station guessing in six tries with distance, direction, prefecture, region, and shared-line hints. |
| **文字 / Kana** | Wordle for 5-kana station names (緑 = right spot, 黄 = in the name, 灰 = not in the name). |
| **路線 / Line** | Guess today’s railway line with operator/region/prefecture overlap/station-count hints. |
| **地図 / Map** | Guess from a fixed Carto tile map clue (z=15, no pan/zoom, circular mask + pin). |
| **コード / Code** | Guess from station numbering codes; starts with one code and reveals one more per miss. |
| **路線図 / Diagram** | Guess from a geographic schematic of the station’s nearby stops (generated from station_database; no names). Optional hand-drawn crops in `public/data/crops/` can override. |

Puzzles refresh at **midnight Japan time**. Each mode has its own daily, including a **per-area** daily (region, city, operator, Shinkansen, or JR). Line city pools are lines with at least three stops in that city. Practice is unlimited. If an area has no answers for that mode (for example Diagram in Naha), the game says so instead of substituting all Japan.

City chips: 札幌, 仙台, 東京 (23 wards), 横浜, 川崎, 千葉, 名古屋, 京都, 大阪, 神戸, 岡山, 広島, 福岡, 北九州, 熊本, 鹿児島, 富山, 那覇. Station city dailies use transfer-quality stations; city practice uses every station in that city. Station mode still draws a Japan map and traces your guess path; a strip marks the nearest metro. After you finish, a dossier lists colored lines, city, opening year when known, and map/Wikipedia links.

## Play locally

```bash
npm install
npm test
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

```bash
npm run build
npm run preview
```

## Data

Stations and lines are built from [Seo-4d696b75/station_database](https://github.com/Seo-4d696b75/station_database) (CC BY 4.0), which is aligned with 駅メモ！ and originally based on 駅データ.jp.

```bash
npm run data
```

That downloads CSVs (cached under `data/raw/`, gitignored) and writes `public/data/game.json`.

- **Guess list:** every operating station (~9,000).
- **Daily Station answers:** transfer stations, Shinkansen stops, plus a handful of famous terminals (~1,100+).
- **Kana answers:** Daily uses 5-kana readings; Practice can switch to 4.
- **Line answers:** ~490 operating lines with enough stations to be guessable. Area chips: dominant region, ≥3 stops in a city, or operator (JR East, Tokyo Metro, Tokyu, Hankyu, Kintetsu, Meitetsu).
- **Code answers:** numbered transfer/famous stations nationwide (~quality pool ∩ codes). In a city, any numbered station in that city.
- **Diagram answers:** transfer / Shinkansen / famous-terminal stations, plus any station on two or more lines (~1,100). Each clue is a geographic schematic of the target plus up to two neighbors on each line. An area with none of those IDs is empty.

Optional crop overrides (hand-made images) still live in `public/data/crops/`:

```bash
node scripts/add-crop.mjs <stationId> <file> <hub> [license]
```

## Rules in brief

Station mode, after each guess:

| Hint | Green | Yellow | Gray |
| --- | --- | --- | --- |
| Prefecture | same | neighboring | elsewhere |
| Lines | at least one shared line | same operator, no shared line | neither |
| Distance | km + compass toward the answer |  |  |

Share an emoji card without spoiling the name.

Stats, language (JA/EN), night/day theme, and colorblind-friendly labels live in the header. Nothing is sent to a server; progress is `localStorage` only.

Map mode tile attribution: © OpenStreetMap © CARTO (Carto `light_nolabels` tiles).
Diagram schematics are generated from station_database coordinates (CC BY 4.0). Record a license on any hand-made crop in `crops.json`.

## Deploy

Static files. GitHub Pages works with `base: "./"` already set in `vite.config.ts`.

```bash
npm run build
# publish the dist/ folder
```
