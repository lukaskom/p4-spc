import type { PartId } from '../ids.js';

export interface Part {
  id: PartId;
  partNumber: string;
  description?: string | undefined;
  abbreviation?: string | undefined;
  drawingNumber?: string | undefined;
  variant?: string | undefined;
  metadata: Readonly<Record<string, unknown>>;
}

export interface NewPart {
  partNumber: string;
  description?: string | undefined;
  abbreviation?: string | undefined;
  drawingNumber?: string | undefined;
  variant?: string | undefined;
  metadata?: Readonly<Record<string, unknown>>;
}
