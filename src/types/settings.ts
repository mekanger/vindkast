export type WindUnit = 'ms' | 'knots';

export interface UserSettings {
  windUnit: WindUnit;
}

// Konvertering: 1 m/s = 1.94384 knop
export const MS_TO_KNOTS = 1.94384;

export function convertWindSpeed(value: number, toUnit: WindUnit): number {
  return toUnit === 'knots' ? value * MS_TO_KNOTS : value;
}

export function getWindUnitLabel(unit: WindUnit): string {
  return unit === 'knots' ? 'kn' : 'm/s';
}
