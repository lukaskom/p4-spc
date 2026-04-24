export const KField = {
  // ── K0xxx — measurement values (per-value attributes) ──
  VALUE: 'K0001',
  STATUS: 'K0002',
  MEASURED_DATE: 'K0004',
  MEASURED_TIME: 'K0005',
  OPERATOR_NR: 'K0008',
  MACHINE_NR: 'K0010',
  GAGE_NR: 'K0012',
  PROCESS_PARAM_NR: 'K0014',
  PART_NR_REF: 'K0053',

  // ── K1xxx — part / product ──
  PART_NUMBER: 'K1001',
  PART_DESCRIPTION: 'K1002',
  PART_ABBREVIATION: 'K1003',
  PART_DRAWING_NUMBER: 'K1007',
  PART_VARIANT: 'K1053',
  PART_PRODUCTION_NR: 'K1081',
  PART_MACHINE_NR: 'K1085',

  // ── K2xxx — characteristic definition ──
  CHAR_NUMBER: 'K2001',
  CHAR_DESCRIPTION: 'K2002',
  CHAR_ABBREVIATION: 'K2003',
  CHAR_TYPE: 'K2004',
  CHAR_GROUP_TYPE: 'K2005',
  CHAR_CLASS: 'K2006',
  CHAR_DECIMALS: 'K2022',
  CHAR_GROUP: 'K2035',
  CHAR_TARGET: 'K2100',
  CHAR_NOMINAL: 'K2101',
  CHAR_LSL: 'K2110',
  CHAR_USL: 'K2111',
  CHAR_LOWER_PLAUSIBILITY: 'K2112',
  CHAR_UPPER_PLAUSIBILITY: 'K2113',
  CHAR_TOLERANCE_TYPE: 'K2120',
  CHAR_UNIT: 'K2142',

  // ── K8xxx — process / measurement context (selection) ──
  MEASUREMENT_PLAN_TEXT: 'K8500',
  MACHINE_CATEGORY: 'K8501',
  MEASUREMENT_FREQUENCY: 'K8502',
  PROCESS_STEP: 'K8530',
} as const;

export type KFieldCode = (typeof KField)[keyof typeof KField];

export type AqdefKFieldMap = Readonly<Partial<Record<KFieldCode, unknown>>>;
