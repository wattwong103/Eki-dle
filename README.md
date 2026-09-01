# 駅dle — Eki-dle

A daily Japanese railway-station puzzle. Three modes:

- **駅 / Station** — Worldle-style. Guess today’s station in six tries. Each miss shows crow-flies distance, compass direction, prefecture (same / neighboring / far), region, and shared lines.
- **文字 / Kana** — Wordle for 5-kana station names (緑 = right spot, 黄 = in the name, 灰 = not in the name).
- **路線 / Line** — Guess today’s railway line. Hints: operator, region, overlapping prefectures, station-count higher/lower. On reveal, the line is plotted on the map.

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

## Rules in brief

Station mode, after each guess:

| Hint | Green | Yellow | Gray |
| --- | --- | --- | --- |
| Prefecture | same | neighboring | elsewhere |
| Lines | at least one shared line | same operator, no shared line | neither |
| Distance | km + compass toward the answer |  |  |

Share an emoji card without spoiling the name.

Stats, language (JA/EN), night/day theme, and colorblind-friendly labels live in the header. Nothing is sent to a server; progress is `localStorage` only.

## Deploy

Static files. GitHub Pages works with `base: "./"` already set in `vite.config.ts`.

```bash
npm run build
# publish the dist/ folder
```
