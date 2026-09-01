import type { Catalog } from "./catalog";
import { METROS } from "./cities";
import type { EkiGuess, Lang, Station } from "./types";

export type JapanRings = number[][][][];

const LNG0 = 122.8;
const LNG1 = 146.2;
const LAT0 = 24.0;
const LAT1 = 45.8;

export function project(
  lng: number,
  lat: number,
  w: number,
  h: number,
  pad = 12,
): [number, number] {
  const x = pad + ((lng - LNG0) / (LNG1 - LNG0)) * (w - pad * 2);
  const y = pad + ((LAT1 - lat) / (LAT1 - LAT0)) * (h - pad * 2);
  return [x, y];
}

export function drawJapanMap(
  canvas: HTMLCanvasElement,
  rings: JapanRings,
  catalog: Catalog,
  guesses: EkiGuess[],
  target: Station | null,
  reveal: boolean,
  lang: Lang = "ja",
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const ink = getCss("--map-land", "#1c3a32");
  const sea = getCss("--map-sea", "#0c1418");
  const stroke = getCss("--map-stroke", "#3d6a5c");

  ctx.fillStyle = sea;
  roundRect(ctx, 0, 0, w, h, 12);
  ctx.fill();

  ctx.beginPath();
  for (const poly of rings) {
    for (const ring of poly) {
      ring.forEach((pt, i) => {
        const [x, y] = project(pt[0]!, pt[1]!, w, h);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
  }
  ctx.fillStyle = ink;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  const label = getCss("--muted", "#8b93a0");
  ctx.fillStyle = label;
  ctx.font = "600 9px ui-sans-serif, 'IBM Plex Sans JP', sans-serif";
  ctx.textBaseline = "bottom";
  const labels = METROS.filter((m) => !["yokohama", "kyoto", "kobe"].includes(m.id));
  for (const city of labels) {
    const [x, y] = project(city.lng, city.lat, w, h);
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = city.lng > 139.5 ? "left" : "right";
    const pad = city.lng > 139.5 ? 4 : -4;
    ctx.fillText(lang === "en" ? city.en : city.ja, x + pad, y - 2);
  }

  if (guesses.length > 1) {
    ctx.beginPath();
    guesses.forEach((g, i) => {
      const s = catalog.byId.get(g.id);
      if (!s) return;
      const [x, y] = project(s.lng, s.lat, w, h);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = getCss("--line", "#c4a35a");
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  guesses.forEach((g, i) => {
    const s = catalog.byId.get(g.id);
    if (!s) return;
    const [x, y] = project(s.lng, s.lat, w, h);
    const last = i === guesses.length - 1;
    ctx.beginPath();
    ctx.arc(x, y, last ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = g.id === target?.id ? "#3fa66b" : last ? "#e23d28" : "#c4a35a";
    ctx.fill();
    ctx.fillStyle = getCss("--ink", "#f3efe6");
    ctx.font = "600 9px ui-sans-serif, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), x, y + 0.5);
  });

  if (reveal && target) {
    const [x, y] = project(target.lng, target.lat, w, h);
    star(ctx, x, y, 8, 4, 5);
    ctx.fillStyle = "#e8c547";
    ctx.fill();
  }
}

export function drawLineStations(
  canvas: HTMLCanvasElement,
  rings: JapanRings,
  stations: Station[],
  color: string,
): void {
  drawJapanMap(canvas, rings, { byId: new Map() } as Catalog, [], null, false);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const fill = color && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : "#e23d28";
  ctx.fillStyle = fill;
  for (const s of stations) {
    const [x, y] = project(s.lng, s.lat, w, h);
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getCss(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v.trim() || fallback;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  inner: number,
  n: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export async function loadJapanRings(): Promise<JapanRings> {
  const res = await fetch("./data/japan.json");
  const geo = (await res.json()) as {
    features: { geometry: { coordinates: JapanRings } }[];
  };
  return geo.features[0]?.geometry.coordinates ?? [];
}
