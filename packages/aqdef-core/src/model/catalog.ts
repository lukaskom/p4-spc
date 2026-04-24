import type { CatalogId } from '../ids.js';
import type { CatalogScope } from './enums.js';

export interface Catalog {
  id: CatalogId;
  key: string;
  name: string;
  scope: CatalogScope;
  version: number;
  isSystem: boolean;
  items: readonly CatalogItem[];
}

export interface CatalogItem {
  code: string | number;
  label: string;
  parentCode?: string | number | undefined;
  order: number;
  active: boolean;
  metadata?: Readonly<Record<string, unknown>> | undefined;
}

export interface CatalogSeed {
  key: string;
  name: string;
  scope: CatalogScope;
  isSystem: boolean;
  items: readonly CatalogItem[];
}
