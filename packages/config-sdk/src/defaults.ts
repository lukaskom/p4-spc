import type { TenantConfig } from './types.js';

export const breweryDefaultConfig: TenantConfig = {
  version: 1,
  tenantId: 'demo-brewery',
  tenantName: 'Demo Pivovar',
  locale: 'cs-CZ',

  labels: {
    partNumber: 'SAP ID',
    description: 'Popis produktu',
    nominal: 'Nominální objem',
    lsl: 'Dolní mez (LSL)',
    usl: 'Horní mez (USL)',
    unit: 'Jednotka',
    line: 'Linka',
    operator: 'Operátor',
    gage: 'Váha',
    measuredAt: 'Naměřeno',
    value: 'Naměřená hodnota',
    cp: 'Cp',
    cpk: 'Cpk',
    pp: 'Pp',
    ppk: 'Ppk',
    mass: 'Hmotnost',
    density: 'Hustota',
    volume: 'Objem',
  },

  aqdefMapping: {
    part: {
      sapId: 'K1001',
      description: 'K1002',
      variant: 'K1053',
    },
    characteristic: {
      code: 'K2001',
      description: 'K2002',
      nominal: 'K2101',
      lsl: 'K2110',
      usl: 'K2111',
      unit: 'K2142',
    },
    measurement: {
      value: 'K0001',
      status: 'K0002',
      measuredAt: 'K0004',
      operator: 'K0008',
      machine: 'K0010',
      gage: 'K0012',
    },
  },

  forms: {
    'brewery-bottle-mass': {
      id: 'brewery-bottle-mass',
      name: 'Měření hmotnosti lahve',
      description:
        'Operátor zváží lahev na kalibrované váze; objem se spočítá z aktuální hustoty z laboratoře.',
      fields: [
        {
          id: 'productId',
          type: 'select',
          label: 'SAP ID',
          required: true,
          optionsFrom: 'products',
          columnSpan: 1,
        },
        {
          id: 'gage',
          type: 'select',
          label: 'Váha',
          required: true,
          optionsFrom: 'gages',
          columnSpan: 1,
        },
        {
          id: 'mass',
          type: 'number',
          label: 'Hmotnost',
          unit: 'g',
          required: true,
          defaultValue: 520.5,
          validation: { min: 0, message: 'Hmotnost musí být kladná' },
          columnSpan: 1,
        },
        {
          id: 'density',
          type: 'readonly',
          label: 'Hustota z laboratoře',
          unit: 'g/ml',
          readFrom: 'latestLabDensity',
          columnSpan: 1,
        },
        {
          id: 'operator',
          type: 'text',
          label: 'Operátor',
          required: true,
          columnSpan: 2,
        },
        {
          id: 'volume',
          type: 'computed',
          label: 'Vypočtený objem',
          unit: 'ml',
          expression: 'mass / density',
          columnSpan: 2,
        },
      ],
      submitLabel: 'Uložit měření',
      resultField: 'volume',
      statusFromField: 'volume',
    },
  },

  transformers: {
    'mass-to-volume': {
      id: 'mass-to-volume',
      name: 'Hmotnost → objem',
      description:
        'Z hmotnosti v g a aktuální hustoty z laboratoře v g/ml vypočte objem v ml. Používá se u plnění lahví, kde se váží náplň a přepočítává se na objem.',
      inputs: ['mass', 'density'],
      output: 'volume',
      expression: 'mass / density',
    },
  },

  spc: {
    defaultChartType: 'i-mr',
    enabledNelsonRules: [1, 2, 3, 4],
    subgroupSize: 5,
    capabilityThresholds: {
      excellent: 1.67,
      good: 1.33,
      marginal: 1.0,
    },
  },

  domain: {
    density: {
      unit: 'g/ml',
      referenceTemperatureC: 20,
    },
  },
};
