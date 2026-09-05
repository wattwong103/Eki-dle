export interface DiagramCrop {
  id: number;
  file: string;
  hub: string;
  license?: string;
}

export interface DiagramManifest {
  version: 1;
  crops: DiagramCrop[];
}

export function parseCropsManifest(raw: unknown): DiagramCrop[] {
  if (!raw || typeof raw !== "object") return [];
  const list = (raw as { crops?: unknown }).crops;
  if (!Array.isArray(list)) return [];
  const out: DiagramCrop[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<DiagramCrop>;
    if (typeof item.id !== "number" || !Number.isFinite(item.id)) continue;
    if (typeof item.file !== "string" || !item.file.trim()) continue;
    if (typeof item.hub !== "string" || !item.hub.trim()) continue;
    out.push({
      id: item.id,
      file: item.file.trim(),
      hub: item.hub.trim(),
      license: typeof item.license === "string" ? item.license : undefined,
    });
  }
  return out;
}

export async function loadCrops(): Promise<DiagramCrop[]> {
  const res = await fetch("./data/crops/crops.json");
  if (!res.ok) return [];
  return parseCropsManifest(await res.json());
}

export function cropForId(crops: DiagramCrop[], id: number): DiagramCrop | undefined {
  return crops.find((x) => x.id === id);
}

export function cropPath(crop: DiagramCrop): string {
  return `./data/crops/${crop.file}`;
}

export function fallbackDiagramSvg(label: string): string {
  const safe = label.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'><rect width='960' height='540' fill='#f4f4f4'/><path d='M80 410 H880' stroke='#333' stroke-width='14'/><circle cx='220' cy='410' r='24' fill='#fff' stroke='#333' stroke-width='8'/><circle cx='480' cy='410' r='24' fill='#fff' stroke='#333' stroke-width='8'/><circle cx='740' cy='410' r='24' fill='#fff' stroke='#333' stroke-width='8'/><text x='480' y='210' text-anchor='middle' font-family='sans-serif' font-size='38' fill='#333'>Diagram hint</text><text x='480' y='260' text-anchor='middle' font-family='sans-serif' font-size='26' fill='#666'>${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
