export interface TenantConfig {
  readonly tenantId: string;
  readonly tenantName: string;
  readonly labels: Readonly<Record<string, string>>;
  readonly density: {
    readonly unit: string;
    readonly referenceTemperatureC: number;
  };
}

export const breweryTenant: TenantConfig = {
  tenantId: 'demo-brewery',
  tenantName: 'Demo Pivovar',
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
  },
  density: {
    unit: 'g/ml',
    referenceTemperatureC: 20,
  },
};

export function label(config: TenantConfig, key: string): string {
  return config.labels[key] ?? key;
}
