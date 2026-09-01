const R = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Initial bearing from point 1 to point 2, degrees 0–360 (0 = north). */
export function bearingDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(p2);
  const x =
    Math.cos(p1) * Math.sin(p2) -
    Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

const COMPASS8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type Compass8 = (typeof COMPASS8)[number];

export const COMPASS_EMOJI: Record<Compass8, string> = {
  N: "⬆️",
  NE: "↗️",
  E: "➡️",
  SE: "↘️",
  S: "⬇️",
  SW: "↙️",
  W: "⬅️",
  NW: "↖️",
};

export function compass8(bearing: number): Compass8 {
  const i = Math.round(bearing / 45) % 8;
  return COMPASS8[i] ?? "N";
}

/** Japan-scale proximity. Log so 20 km and 400 km do not both read as “almost there”. */
export const MAX_KM = 2800;

export function proximityPct(km: number): number {
  if (km <= 0) return 100;
  const p = 1 - Math.log(1 + Math.min(km, MAX_KM)) / Math.log(1 + MAX_KM);
  return Math.round(Math.max(0, Math.min(100, p * 100)));
}

export function formatKm(km: number, lang: "ja" | "en"): string {
  if (km < 1) return lang === "ja" ? "1km未満" : "<1 km";
  return `${Math.round(km).toLocaleString()} km`;
}
