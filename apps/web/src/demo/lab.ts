import type { ProductDto } from '../api/types';

export interface DemoDensityReading {
  readonly id: string;
  readonly sapId: string;
  readonly measuredAt: string;
  readonly operator: string;
  readonly densityGPerMl: number;
}

const LAB_OPERATORS = ['dr. Svobodová', 'Ing. Horák'];
const NOW = new Date('2026-04-24T10:00:00Z').getTime();

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randNormal(rand: () => number, mean: number, stdev: number): number {
  const u1 = Math.max(rand(), 1e-12);
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdev;
}

function hashToSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateDensityReadings(products: readonly ProductDto[]): Record<string, readonly DemoDensityReading[]> {
  const result: Record<string, DemoDensityReading[]> = {};
  for (const p of products) {
    const reference = (p.metadata.referenceDensity as number | undefined) ?? 1.04;
    const rand = mulberry32(hashToSeed(`d:${p.id}`));
    const out: DemoDensityReading[] = [];
    const pointCount = 8;
    for (let i = 0; i < pointCount; i++) {
      const t = NOW - (pointCount - i) * 180 * 60_000;
      const density = randNormal(rand, reference, 0.0006);
      const operator = LAB_OPERATORS[Math.floor(rand() * LAB_OPERATORS.length)] ?? LAB_OPERATORS[0]!;
      out.push({
        id: `${p.id}-d-${i.toString().padStart(3, '0')}`,
        sapId: p.partNumber,
        measuredAt: new Date(t).toISOString(),
        operator,
        densityGPerMl: Number(density.toFixed(4)),
      });
    }
    result[p.id] = out;
  }
  return result;
}

export function latestDensity(
  readings: readonly DemoDensityReading[] | undefined,
): DemoDensityReading | undefined {
  if (!readings || readings.length === 0) return undefined;
  return readings[readings.length - 1];
}

export function volumeFromMassAndDensity(massG: number, densityGPerMl: number): number {
  return massG / densityGPerMl;
}
