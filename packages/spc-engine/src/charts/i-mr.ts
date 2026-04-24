import { shewhartConstants } from '../constants/shewhart.js';
import { mean, movingRanges } from '../statistics/descriptive.js';
import type { IMRResult } from './types.js';

export interface IMRInput {
  readonly values: readonly number[];
}

export function iMRLimits({ values }: IMRInput): IMRResult {
  if (values.length < 2) {
    throw new RangeError('iMRLimits requires at least 2 values');
  }

  const mrs = movingRanges(values);
  const meanValue = mean(values);
  const mrBar = mean(mrs);

  const { E2, D3, D4 } = shewhartConstants(2);

  return {
    valueCount: values.length,
    meanValue,
    mrBar,
    individuals: {
      center: meanValue,
      ucl: meanValue + E2 * mrBar,
      lcl: meanValue - E2 * mrBar,
    },
    movingRange: {
      center: mrBar,
      ucl: D4 * mrBar,
      lcl: D3 * mrBar,
    },
  };
}
