export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('mean requires at least one value');
  }
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

export function range(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('range requires at least one value');
  }
  let min = values[0] as number;
  let max = min;
  for (let i = 1; i < values.length; i++) {
    const v = values[i] as number;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

export function sampleStdev(values: readonly number[]): number {
  if (values.length < 2) {
    throw new RangeError('sampleStdev requires at least two values');
  }
  const m = mean(values);
  let sumSquaredDeviations = 0;
  for (const v of values) {
    const diff = v - m;
    sumSquaredDeviations += diff * diff;
  }
  return Math.sqrt(sumSquaredDeviations / (values.length - 1));
}

export function movingRanges(values: readonly number[]): number[] {
  if (values.length < 2) {
    throw new RangeError('movingRanges requires at least two values');
  }
  const out: number[] = [];
  for (let i = 1; i < values.length; i++) {
    out.push(Math.abs((values[i] as number) - (values[i - 1] as number)));
  }
  return out;
}
