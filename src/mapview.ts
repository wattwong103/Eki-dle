import type { Station } from "./types";

export const TILE_ZOOM = 15;
export const TILE_SIZE = 256;
const SUBDOMAINS = ["a", "b", "c", "d"] as const;

export interface TilePoint {
  x: number;
  y: number;
}

export interface TileCoord {
  x: number;
  y: number;
  z: number;
}

export function lonLatToWorldPixel(lng: number, lat: number, z = TILE_ZOOM): TilePoint {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n * TILE_SIZE;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) *
    n *
    TILE_SIZE;
  return { x, y };
}

export function tileXY(lng: number, lat: number, z = TILE_ZOOM): TilePoint {
  const p = lonLatToWorldPixel(lng, lat, z);
  return { x: Math.floor(p.x / TILE_SIZE), y: Math.floor(p.y / TILE_SIZE) };
}

export function tiles3x3(center: TilePoint, z = TILE_ZOOM): TileCoord[] {
  const out: TileCoord[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      out.push({ x: center.x + dx, y: center.y + dy, z });
    }
  }
  return out;
}

export function tileUrl(x: number, y: number, z = TILE_ZOOM): string {
  const sub = SUBDOMAINS[Math.abs((x + y) % SUBDOMAINS.length)] ?? "a";
  return `https://${sub}.basemaps.cartocdn.com/light_nolabels/${z}/${x}/${y}.png`;
}

export async function drawMapView(canvas: HTMLCanvasElement, station: Station): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const centerTile = tileXY(station.lng, station.lat, TILE_ZOOM);
  const world = lonLatToWorldPixel(station.lng, station.lat, TILE_ZOOM);
  const originX = (centerTile.x - 1) * TILE_SIZE;
  const originY = (centerTile.y - 1) * TILE_SIZE;
  const markerX = world.x - originX;
  const markerY = world.y - originY;

  const stitch = document.createElement("canvas");
  stitch.width = TILE_SIZE * 3;
  stitch.height = TILE_SIZE * 3;
  const sctx = stitch.getContext("2d");
  if (!sctx) return;

  await Promise.all(
    tiles3x3(centerTile).map(async (tile) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        img.onload = () => {
          sctx.drawImage(img, (tile.x - (centerTile.x - 1)) * TILE_SIZE, (tile.y - (centerTile.y - 1)) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = tileUrl(tile.x, tile.y, tile.z);
      });
    }),
  );

  const radius = Math.max(40, Math.min(w, h) * 0.42);
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(stitch, cx - markerX, cy - markerY);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy - 15);
  ctx.lineTo(cx + 10, cy + 8);
  ctx.lineTo(cx, cy + 15);
  ctx.lineTo(cx - 10, cy + 8);
  ctx.closePath();
  ctx.fillStyle = "#e23d28";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy + 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
}

export const MAP_ATTRIBUTION = "© OpenStreetMap © CARTO";
