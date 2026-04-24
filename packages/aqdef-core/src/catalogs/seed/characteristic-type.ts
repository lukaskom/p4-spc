import type { CatalogSeed } from '../../model/catalog.js';
import { KField } from '../../kfields/index.js';

export const characteristicTypeCatalog: CatalogSeed = {
  key: `aqdef.${KField.CHAR_TYPE.toLowerCase()}.type`,
  name: 'Characteristic type (K2004)',
  scope: 'aqdef',
  isSystem: true,
  items: [
    { code: 1, label: 'Variable (measurable)', order: 1, active: true },
    { code: 2, label: 'Attribute (countable)', order: 2, active: true },
  ],
};
