import type { CatalogSeed } from '../../model/catalog.js';
import { characteristicTypeCatalog } from './characteristic-type.js';
import { measurementStatusCatalog } from './measurement-status.js';
import { toleranceTypeCatalog } from './tolerance-type.js';

export { measurementStatusCatalog } from './measurement-status.js';
export { characteristicTypeCatalog } from './characteristic-type.js';
export { toleranceTypeCatalog } from './tolerance-type.js';

export const systemCatalogSeeds: readonly CatalogSeed[] = [
  measurementStatusCatalog,
  characteristicTypeCatalog,
  toleranceTypeCatalog,
];
