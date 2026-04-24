import { products, productLineAssignment } from './brewery';
import { mulberry32, randNormal } from './prng';

export interface DemoMeasurement {
  readonly id: string;
  readonly productId: string;
  readonly lineId: string;
  readonly measuredAt: string;
  readonly operator: string;
  readonly gage: string;
  readonly massG: number;
  readonly densityGPerMl: number;
  readonly volumeMl: number;
  readonly status: 'ok' | 'warning' | 'reject';
}

export interface DemoDensityReading {
  readonly id: string;
  readonly productId: string;
  readonly measuredAt: string;
  readonly operator: string;
  readonly densityGPerMl: number;
}

const OPERATORS = ['Jana N.', 'Petr K.', 'Marek V.', 'Lenka D.', 'Ondřej P.'];
const LAB_OPERATORS = ['dr. Svobodová', 'Ing. Horák'];

const MS_PER_MIN = 60_000;

function hashToSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function statusFor(volume: number, lsl: number, usl: number): DemoMeasurement['status'] {
  if (volume < lsl || volume > usl) return 'reject';
  const warningMargin = (usl - lsl) * 0.1;
  if (volume < lsl + warningMargin || volume > usl - warningMargin) return 'warning';
  return 'ok';
}

const NOW_REFERENCE = new Date('2026-04-24T10:00:00Z').getTime();

export const measurementsByProduct: Readonly<Record<string, readonly DemoMeasurement[]>> =
  (() => {
    const map: Record<string, DemoMeasurement[]> = {};
    for (const product of products) {
      const lineId = productLineAssignment[product.id] ?? 'L1';
      const rand = mulberry32(hashToSeed(`m:${product.id}`));
      const out: DemoMeasurement[] = [];
      const pointCount = 60;
      const driftOnL2 = lineId === 'L2';
      for (let i = 0; i < pointCount; i++) {
        const t = NOW_REFERENCE - (pointCount - i) * 15 * MS_PER_MIN;
        const drift = driftOnL2 ? Math.max(0, (i - 40) * 0.35) : 0;
        const targetVolume = product.nominalMl - drift;
        const volume = randNormal(rand, targetVolume, 1.2);
        const density = product.referenceDensityGPerMl + randNormal(rand, 0, 0.0008);
        const mass = volume * density;
        const gage = rand() > 0.5 ? 'SCALE-A' : 'SCALE-B';
        const operator = OPERATORS[Math.floor(rand() * OPERATORS.length)] ?? OPERATORS[0]!;
        out.push({
          id: `${product.id}-${i.toString().padStart(3, '0')}`,
          productId: product.id,
          lineId,
          measuredAt: new Date(t).toISOString(),
          operator,
          gage,
          massG: Number(mass.toFixed(2)),
          densityGPerMl: Number(density.toFixed(4)),
          volumeMl: Number(volume.toFixed(2)),
          status: statusFor(volume, product.lslMl, product.uslMl),
        });
      }
      map[product.id] = out;
    }
    return map;
  })();

export const densityReadingsByProduct: Readonly<Record<string, readonly DemoDensityReading[]>> =
  (() => {
    const map: Record<string, DemoDensityReading[]> = {};
    for (const product of products) {
      const rand = mulberry32(hashToSeed(`d:${product.id}`));
      const out: DemoDensityReading[] = [];
      const pointCount = 8;
      for (let i = 0; i < pointCount; i++) {
        const t = NOW_REFERENCE - (pointCount - i) * 180 * MS_PER_MIN;
        const density = randNormal(rand, product.referenceDensityGPerMl, 0.0006);
        const operator = LAB_OPERATORS[Math.floor(rand() * LAB_OPERATORS.length)] ?? LAB_OPERATORS[0]!;
        out.push({
          id: `${product.id}-d-${i.toString().padStart(3, '0')}`,
          productId: product.id,
          measuredAt: new Date(t).toISOString(),
          operator,
          densityGPerMl: Number(density.toFixed(4)),
        });
      }
      map[product.id] = out;
    }
    return map;
  })();

export function latestMeasurement(productId: string): DemoMeasurement | undefined {
  const list = measurementsByProduct[productId];
  return list && list.length ? list[list.length - 1] : undefined;
}

export function latestDensity(productId: string): DemoDensityReading | undefined {
  const list = densityReadingsByProduct[productId];
  return list && list.length ? list[list.length - 1] : undefined;
}

export function volumeFromMassAndDensity(massG: number, densityGPerMl: number): number {
  return massG / densityGPerMl;
}
