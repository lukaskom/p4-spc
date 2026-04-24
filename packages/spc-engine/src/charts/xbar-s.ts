import { shewhartConstants } from '../constants/shewhart.js';
import { mean, sampleStdev } from '../statistics/descriptive.js';
import type { XbarSResult } from './types.js';

export interface XbarSInput {
  readonly subgroups: readonly (readonly number[])[];
}

export function xbarSLimits({ subgroups }: XbarSInput): XbarSResult {
  if (subgroups.length < 2) {
    throw new RangeError('xbarSLimits requires at least 2 subgroups');
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

  const { A3, B3, B4 } = shewhartConstants(subgroupSize);

  const means = subgroups.map((s) => mean(s));
  const stdevs = subgroups.map((s) => sampleStdev(s));

  const xDoubleBar = mean(means);
  const sBar = mean(stdevs);

  return {
    subgroupSize,
    subgroupCount: subgroups.length,
    xDoubleBar,
    sBar,
    xbar: {
      center: xDoubleBar,
      ucl: xDoubleBar + A3 * sBar,
      lcl: xDoubleBar - A3 * sBar,
    },
    s: {
      center: sBar,
      ucl: B4 * sBar,
      lcl: B3 * sBar,
    },
  };
}
