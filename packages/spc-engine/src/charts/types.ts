export interface ControlLimits {
  readonly center: number;
  readonly ucl: number;
  readonly lcl: number;
}

export interface XbarRResult {
  readonly subgroupSize: number;
  readonly subgroupCount: number;
  readonly xbar: ControlLimits;
  readonly r: ControlLimits;
  readonly rBar: number;
  readonly xDoubleBar: number;
}

export interface XbarSResult {
  readonly subgroupSize: number;
  readonly subgroupCount: number;
  readonly xbar: ControlLimits;
  readonly s: ControlLimits;
  readonly sBar: number;
  readonly xDoubleBar: number;
}

export interface IMRResult {
  readonly valueCount: number;
  readonly individuals: ControlLimits;
  readonly movingRange: ControlLimits;
  readonly meanValue: number;
  readonly mrBar: number;
}
