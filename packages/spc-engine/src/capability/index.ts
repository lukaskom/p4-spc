import { shewhartConstants } from '../constants/shewhart.js';
import { mean, range, sampleStdev } from '../statistics/descriptive.js';
import type { CapabilityInput, CapabilityResult, SpecLimits } from './types.js';

export * from './types.js';

function computeTwoSidedIndex(
  meanValue: number,
  sigma: number,
  { lsl, usl }: SpecLimits,
): { overall: number | null; kAdjusted: number | null } {
  if (sigma <= 0 || !Number.isFinite(sigma)) {
    return { overall: null, kAdjusted: null };
  }
  const hasLsl = typeof lsl === 'number' && Number.isFinite(lsl);
  const hasUsl = typeof usl === 'number' && Number.isFinite(usl);

  let overall: number | null = null;
  let kAdjusted: number | null = null;

  if (hasLsl && hasUsl) {
    overall = (usl - lsl) / (6 * sigma);
    const upper = (usl - meanValue) / (3 * sigma);
    const lower = (meanValue - lsl) / (3 * sigma);
    kAdjusted = Math.min(upper, lower);
  } else if (hasUsl) {
    kAdjusted = (usl - meanValue) / (3 * sigma);
  } else if (hasLsl) {
    kAdjusted = (meanValue - lsl) / (3 * sigma);
  }

  return { overall, kAdjusted };
}

function flatten(subgroups: readonly (readonly number[])[]): number[] {
  const out: number[] = [];
  for (const s of subgroups) {
    for (const v of s) out.push(v);
  }
  return out;
}

function sigmaFromSubgroups(subgroups: readonly (readonly number[])[]): number | null {
  if (subgroups.length < 2) return null;
  const n = (subgroups[0] as readonly number[]).length;
  if (n < 2 || n > 25) return null;
  for (let i = 0; i < subgroups.length; i++) {
    if ((subgroups[i] as readonly number[]).length !== n) return null;
  }
  const rBar = mean(subgroups.map((s) => range(s)));
  const { d2 } = shewhartConstants(n);
  return rBar / d2;
}

export function capability(input: CapabilityInput): CapabilityResult {
  const { subgroups, values, lsl, usl, target } = input;
  if (!subgroups && !values) {
    throw new RangeError('capability requires either `subgroups` or `values`');
  }

  const allValues = values ?? (subgroups ? flatten(subgroups) : []);
  if (allValues.length < 2) {
    throw new RangeError('capability requires at least 2 values');
  }

  const meanValue = mean(allValues);
  const sigmaOverall = sampleStdev(allValues);
  const sigmaWithin = subgroups ? sigmaFromSubgroups(subgroups) : null;

  const specLimits: SpecLimits = { lsl, usl, target };

  const overallFromWithin = sigmaWithin
    ? computeTwoSidedIndex(meanValue, sigmaWithin, specLimits)
    : { overall: null, kAdjusted: null };
  const overallFromOverall = computeTwoSidedIndex(meanValue, sigmaOverall, specLimits);

  return {
    mean: meanValue,
    sigmaWithin,
    sigmaOverall,
    cp: overallFromWithin.overall,
    cpk: overallFromWithin.kAdjusted,
    pp: overallFromOverall.overall,
    ppk: overallFromOverall.kAdjusted,
    sampleCount: allValues.length,
    specLimits,
  };
}
