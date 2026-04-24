import type { CatalogSeed } from '../../model/catalog.js';
import { KField } from '../../kfields/index.js';

export const measurementStatusCatalog: CatalogSeed = {
  key: `aqdef.${KField.STATUS.toLowerCase()}.status`,
  name: 'Measurement value status (K0002)',
  scope: 'aqdef',
  isSystem: true,
  items: [
    { code: 0, label: 'In tolerance', order: 1, active: true },
    { code: 1, label: 'Warning (within warning limits)', order: 2, active: true },
    { code: 13, label: 'Rework required', order: 3, active: true },
    { code: 14, label: 'Scrap', order: 4, active: true },
    { code: 255, label: 'Invalid value', order: 5, active: true },
  ],
};
