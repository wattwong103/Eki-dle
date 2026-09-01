# 駅dle — Eki-dle

A daily Japanese railway-station puzzle. Two modes:

- **駅 / Station** — Worldle-style. Guess today’s station in six tries. Each miss shows crow-flies distance, compass direction, prefecture (same / neighboring / far), region, and shared lines.
- **文字 / Kana** — Wordle for 5-kana station names (緑 = right spot, 黄 = in the name, 灰 = not in the name).

Puzzles refresh at **midnight Japan time**. Everyone gets the same daily station. Practice mode is unlimited.

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
- **Daily Station answers:** transfer stations (2+ lines) and Shinkansen stops (~1,100).
- **Kana answers:** operating stations whose hiragana reading is exactly 5 characters.

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
