import { PrismaClient } from '../generated/client/index.js';
import { systemCatalogSeeds } from '@p4-spc/aqdef-core';

const prisma = new PrismaClient();

const BREWERY_PRODUCTS = [
  {
    sapId: 'SAP-P4-10-500',
    description: 'Světlé výčepní 10°',
    plato: 10,
    nominalMl: 500,
    lslMl: 495,
    uslMl: 505,
    density: 1.0398,
    driftInBatch2: false,
  },
  {
    sapId: 'SAP-P4-11-500',
    description: 'Ležák 11°',
    plato: 11,
    nominalMl: 500,
    lslMl: 495,
    uslMl: 505,
    density: 1.0440,
    driftInBatch2: true,
  },
  {
    sapId: 'SAP-P4-12-500',
    description: 'Speciál 12°',
    plato: 12,
    nominalMl: 500,
    lslMl: 495,
    uslMl: 505,
    density: 1.0482,
    driftInBatch2: false,
  },
  {
    sapId: 'SAP-P4-11P-500',
    description: 'Polotmavé 11°',
    plato: 11,
    nominalMl: 500,
    lslMl: 495,
    uslMl: 505,
    density: 1.0440,
    driftInBatch2: false,
  },
];

const OPERATORS = ['Jana N.', 'Petr K.', 'Marek V.', 'Lenka D.', 'Ondřej P.'];
const GAGES = ['SCALE-A', 'SCALE-B'];

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

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function statusFor(volume: number, lsl: number, usl: number): number {
  if (volume < lsl || volume > usl) return 14;
  const margin = (usl - lsl) * 0.1;
  if (volume < lsl + margin || volume > usl - margin) return 1;
  return 0;
}

const NOW = new Date('2026-04-24T10:00:00Z').getTime();

async function main(): Promise<void> {
  console.log('Seeding data-plane DB...');

  for (const seed of systemCatalogSeeds) {
    const catalog = await prisma.catalog.upsert({
      where: { key: seed.key },
      update: { name: seed.name, scope: seed.scope, isSystem: seed.isSystem },
      create: {
        key: seed.key,
        name: seed.name,
        scope: seed.scope,
        isSystem: seed.isSystem,
      },
    });
    for (const item of seed.items) {
      await prisma.catalogItem.upsert({
        where: { catalogId_code: { catalogId: catalog.id, code: String(item.code) } },
        update: { label: item.label, order: item.order, active: item.active },
        create: {
          catalogId: catalog.id,
          code: String(item.code),
          label: item.label,
          order: item.order,
          active: item.active,
        },
      });
    }
    console.log(`  catalog: ${seed.key} (${seed.items.length} items)`);
  }

  for (const p of BREWERY_PRODUCTS) {
    const part = await prisma.part.upsert({
      where: { partNumber_variant: { partNumber: p.sapId, variant: '' } },
      update: {
        description: p.description,
        metadata: {
          plato: p.plato,
          referenceDensity: p.density,
        },
      },
      create: {
        partNumber: p.sapId,
        variant: '',
        description: p.description,
        metadata: {
          plato: p.plato,
          referenceDensity: p.density,
        },
      },
    });

    const char = await prisma.characteristic.upsert({
      where: { partId_code: { partId: part.id, code: 'volume' } },
      update: {
        description: 'Objem v lahvi',
        type: 1,
        unit: 'ml',
        decimals: 2,
        nominal: p.nominalMl,
        target: p.nominalMl,
        lowerSpecLimit: p.lslMl,
        upperSpecLimit: p.uslMl,
        toleranceType: 0,
      },
      create: {
        partId: part.id,
        code: 'volume',
        description: 'Objem v lahvi',
        type: 1,
        unit: 'ml',
        decimals: 2,
        nominal: p.nominalMl,
        target: p.nominalMl,
        lowerSpecLimit: p.lslMl,
        upperSpecLimit: p.uslMl,
        toleranceType: 0,
      },
    });

    await prisma.measurement.deleteMany({ where: { characteristicId: char.id } });

    const rand = mulberry32(hash(`m:${p.sapId}`));
    const pointCount = 60;
    for (let i = 0; i < pointCount; i++) {
      const t = new Date(NOW - (pointCount - i) * 15 * 60_000);
      const drift = p.driftInBatch2 ? Math.max(0, (i - 40) * 0.35) : 0;
      const targetVolume = p.nominalMl - drift;
      const volume = randNormal(rand, targetVolume, 1.2);
      const density = p.density + randNormal(rand, 0, 0.0008);
      const mass = volume * density;
      const gage = rand() > 0.5 ? GAGES[0]! : GAGES[1]!;
      const operator = OPERATORS[Math.floor(rand() * OPERATORS.length)]!;

      await prisma.measurement.create({
        data: {
          characteristicId: char.id,
          value: Number(volume.toFixed(2)),
          status: statusFor(volume, p.lslMl, p.uslMl),
          measuredAt: t,
          operatorId: operator,
          gageId: gage,
          aqdefKFields: {
            K0001: Number(volume.toFixed(2)),
            K0008: operator,
            K0012: gage,
          },
          extensions: {
            mass: Number(mass.toFixed(2)),
            density: Number(density.toFixed(4)),
          },
        },
      });
    }
    console.log(`  product ${p.sapId}: ${pointCount} measurements`);
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
