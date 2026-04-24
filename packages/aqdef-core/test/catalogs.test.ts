import { describe, expect, it } from 'vitest';
import {
  characteristicTypeCatalog,
  measurementStatusCatalog,
  systemCatalogSeeds,
  toleranceTypeCatalog,
} from '../src/index.js';

describe('system catalog seeds', () => {
  it('contains the three core AQDEF catalogs', () => {
    expect(systemCatalogSeeds).toHaveLength(3);
    const keys = systemCatalogSeeds.map((c) => c.key);
    expect(keys).toContain('aqdef.k0002.status');
    expect(keys).toContain('aqdef.k2004.type');
    expect(keys).toContain('aqdef.k2120.type');
  });

  it('are all marked as system catalogs in aqdef scope', () => {
    for (const seed of systemCatalogSeeds) {
      expect(seed.isSystem).toBe(true);
      expect(seed.scope).toBe('aqdef');
    }
  });

  it('have unique item codes within each catalog', () => {
    for (const seed of systemCatalogSeeds) {
      const codes = seed.items.map((i) => i.code);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });
});

describe('measurementStatusCatalog', () => {
  it('includes the canonical OK and invalid codes', () => {
    const codes = measurementStatusCatalog.items.map((i) => i.code);
    expect(codes).toContain(0);
    expect(codes).toContain(255);
  });
});

describe('characteristicTypeCatalog', () => {
  it('has exactly Variable(1) and Attribute(2)', () => {
    expect(characteristicTypeCatalog.items.map((i) => i.code).sort()).toEqual([1, 2]);
  });
});

describe('toleranceTypeCatalog', () => {
  it('covers two-sided, one-sided upper/lower and natural', () => {
    expect(toleranceTypeCatalog.items.map((i) => i.code).sort()).toEqual([0, 1, 2, 3]);
  });
});
