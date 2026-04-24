import type { CatalogSeed } from '../../model/catalog.js';
import { KField } from '../../kfields/index.js';

export const toleranceTypeCatalog: CatalogSeed = {
  key: `aqdef.${KField.CHAR_TOLERANCE_TYPE.toLowerCase()}.type`,
  name: 'Tolerance type (K2120)',
  scope: 'aqdef',
  isSystem: true,
  items: [
    { code: 0, label: 'Two-sided', order: 1, active: true },
    { code: 1, label: 'One-sided upper (USL only)', order: 2, active: true },
    { code: 2, label: 'One-sided lower (LSL only)', order: 3, active: true },
    { code: 3, label: 'Natural boundary', order: 4, active: true },
  ],
};
