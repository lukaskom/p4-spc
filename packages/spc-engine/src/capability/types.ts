export interface SpecLimits {
  readonly lsl?: number | undefined;
  readonly usl?: number | undefined;
  readonly target?: number | undefined;
}

export interface CapabilityInput extends SpecLimits {
  readonly subgroups?: readonly (readonly number[])[] | undefined;
  readonly values?: readonly number[] | undefined;
}

export interface CapabilityResult {
  readonly mean: number;
  readonly sigmaWithin: number | null;
  readonly sigmaOverall: number;
  readonly cp: number | null;
  readonly cpk: number | null;
  readonly pp: number | null;
  readonly ppk: number | null;
  readonly sampleCount: number;
  readonly specLimits: SpecLimits;
}
