# 駅dle — Eki-dle

A daily Japanese railway-station puzzle. Six modes:

| Mode | Summary |
| --- | --- |
| **駅 / Station** | Worldle-style station guessing in six tries with distance, direction, prefecture, region, and shared-line hints. |
| **文字 / Kana** | Wordle for 5-kana station names (緑 = right spot, 黄 = in the name, 灰 = not in the name). |
| **路線 / Line** | Guess today’s railway line with operator/region/prefecture overlap/station-count hints. |
| **地図 / Map** | Guess from a fixed Carto tile map clue (z=15, no pan/zoom, circular mask + pin). |
| **コード / Code** | Guess from station numbering codes; starts with one code and reveals one more per miss. |
| **路線図 / Diagram** | Guess from route-map crops (`public/data/crops/`), with SVG fallback when an image is missing. |

Puzzles refresh at **midnight Japan time**. Each mode has its own daily. Practice is unlimited, and Station practice can be scoped by region (北海道…九州) or city (札幌, 仙台, 東京, 横浜, 名古屋, 京都, 大阪, 神戸, 広島, 福岡, 那覇). The map labels those cities and traces your guess path; a strip diagram marks the nearest metro. After you finish, a dossier lists colored lines, city, opening year when known, and map/Wikipedia links.

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
- **Kana answers:** operating stations whose hiragana reading is exactly 5 characters.
- **Line answers:** ~490 operating lines with enough stations to be guessable.
- **Code answers:** stations with at least one numbering code (~4,800+).
- **Diagram answers:** station IDs listed in `public/data/crops/crops.json` (Tokyo/Osaka hubs first for v1).

Diagram crop workflow:

```bash
node scripts/add-crop.mjs <stationId> <file> <hub> [license]
```

Initial v1 hub list (20): Tokyo, Shinjuku, Shibuya, Ikebukuro, Shinagawa, Ueno, Akihabara, Otemachi, Osaka, Umeda, Namba, Tennoji, Shin-Osaka, Kyobashi, Yodoyabashi, Hommachi, Nagoya, Yokohama, Kyoto, Sannomiya.

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
Route-map crop licensing should be recorded per entry in `crops.json`.

## Deploy

Static files. GitHub Pages works with `base: "./"` already set in `vite.config.ts`.

```bash
npm run build
# publish the dist/ folder
```
