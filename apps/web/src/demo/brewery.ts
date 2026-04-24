export interface DemoProduct {
  readonly id: string;
  readonly sapId: string;
  readonly description: string;
  readonly plato: number;
  readonly nominalMl: number;
  readonly lslMl: number;
  readonly uslMl: number;
  readonly referenceDensityGPerMl: number;
}

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

export const products: readonly DemoProduct[] = [
  {
    id: 'prod-10',
    sapId: 'SAP-P4-10-500',
    description: 'Světlé výčepní 10°',
    plato: 10,
    nominalMl: 500,
    lslMl: 495,
    uslMl: 505,
    referenceDensityGPerMl: 1.0398,
  },
  {
    id: 'prod-11',
    sapId: 'SAP-P4-11-500',
    description: 'Ležák 11°',
    plato: 11,
    nominalMl: 500,
    lslMl: 495,
    uslMl: 505,
    referenceDensityGPerMl: 1.0440,
  },
  {
    id: 'prod-12',
    sapId: 'SAP-P4-12-500',
    description: 'Speciál 12°',
    plato: 12,
    nominalMl: 500,
    lslMl: 495,
    uslMl: 505,
    referenceDensityGPerMl: 1.0482,
  },
  {
    id: 'prod-11p',
    sapId: 'SAP-P4-11P-500',
    description: 'Polotmavé 11°',
    plato: 11,
    nominalMl: 500,
    lslMl: 495,
    uslMl: 505,
    referenceDensityGPerMl: 1.0440,
  },
];

export const productLineAssignment: Readonly<Record<string, string>> = {
  'prod-10': 'L1',
  'prod-11': 'L2',
  'prod-12': 'L3',
  'prod-11p': 'L4',
};

export function findProduct(id: string): DemoProduct | undefined {
  return products.find((p) => p.id === id);
}

export function findLine(id: string): DemoLine | undefined {
  return lines.find((l) => l.id === id);
}

export function findScale(id: string): DemoScale | undefined {
  return scales.find((s) => s.id === id);
}
