import { shewhartConstants } from '../constants/shewhart.js';
import { mean, range } from '../statistics/descriptive.js';
import type { XbarRResult } from './types.js';

export interface XbarRInput {
  readonly subgroups: readonly (readonly number[])[];
}

export function xbarRLimits({ subgroups }: XbarRInput): XbarRResult {
  if (subgroups.length < 2) {
    throw new RangeError('xbarRLimits requires at least 2 subgroups');
  }
  const subgroupSize = (subgroups[0] as readonly number[]).length;
  if (subgroupSize < 2 || subgroupSize > 25) {
    throw new RangeError(`subgroup size must be in 2..25, got ${subgroupSize}`);
  }
  for (let i = 0; i < subgroups.length; i++) {
    if ((subgroups[i] as readonly number[]).length !== subgroupSize) {
      throw new RangeError(
        `all subgroups must have the same size; subgroup ${i} has length ${(subgroups[i] as readonly number[]).length}, expected ${subgroupSize}`,
      );
    }
  }

  const { A2, D3, D4 } = shewhartConstants(subgroupSize);

  const means = subgroups.map((s) => mean(s));
  const ranges = subgroups.map((s) => range(s));

  const xDoubleBar = mean(means);
  const rBar = mean(ranges);

  return {
    subgroupSize,
    subgroupCount: subgroups.length,
    xDoubleBar,
    rBar,
    xbar: {
      center: xDoubleBar,
      ucl: xDoubleBar + A2 * rBar,
      lcl: xDoubleBar - A2 * rBar,
    },
    r: {
      center: rBar,
      ucl: D4 * rBar,
      lcl: D3 * rBar,
    },
  };
}
