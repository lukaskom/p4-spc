export interface DemoLine {
  readonly id: string;
  readonly name: string;
  readonly kind: 'production' | 'lab';
  readonly scaleId: string | null;
}

export interface DemoScale {
  readonly id: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly precisionG: number;
}

export const scales: readonly DemoScale[] = [
  { id: 'SCALE-A', manufacturer: 'Mettler Toledo', model: 'XPR-505-SE', precisionG: 0.1 },
  { id: 'SCALE-B', manufacturer: 'Sartorius', model: 'Cubis II MCA3202P', precisionG: 0.2 },
];

export const lines: readonly DemoLine[] = [
  { id: 'L1', name: 'Linka 1 — Světlé výčepní', kind: 'production', scaleId: 'SCALE-A' },
  { id: 'L2', name: 'Linka 2 — Ležák', kind: 'production', scaleId: 'SCALE-A' },
  { id: 'L3', name: 'Linka 3 — Speciál', kind: 'production', scaleId: 'SCALE-B' },
  { id: 'L4', name: 'Linka 4 — Polotmavé', kind: 'production', scaleId: 'SCALE-B' },
  { id: 'LAB', name: 'Laboratoř — hustota', kind: 'lab', scaleId: null },
];

export const productLineAssignment: Readonly<Record<string, string>> = {
  'P4-10-500': 'L1',
  'P4-11-500': 'L2',
  'P4-12-500': 'L3',
  'P4-11P-500': 'L4',
};

export function findScale(id: string): DemoScale | undefined {
  return scales.find((s) => s.id === id);
}

export function lineForSapId(sapId: string): string | undefined {
  for (const [key, lineId] of Object.entries(productLineAssignment)) {
    if (sapId.includes(key)) return lineId;
  }
  return undefined;
}
