export enum DimensionType {
  SECTION = 0,
  INNER = 1,
  OUTER = 2
}
export type DimensionTypeName = keyof typeof DimensionType;

export const dimensionTypeConfigs: { value: number; name: DimensionTypeName; label: string }[] = [
  { value: 0, name: 'SECTION', label: 'Compartment' },
  { value: 1, name: 'INNER', label: 'Inner' },
  { value: 2, name: 'OUTER', label: 'Outer' }
];
export const dimensionTypeLookup: Record<number, DimensionTypeName> = Object.fromEntries(
  dimensionTypeConfigs.map(({ value, name }) => [value, name])
);

export enum LidType {
  INSERT = 0,
  COVER = 1
}
export type LidTypeName = keyof typeof LidType;

export const lidTypeConfigs: { value: number; name: LidTypeName; label: string }[] = [
  { value: 0, name: 'INSERT', label: 'Insert' },
  { value: 1, name: 'COVER', label: 'Cover' }
];
export const lidTypeLookup: Record<number, LidTypeName> = Object.fromEntries(lidTypeConfigs.map(({ value, name }) => [value, name]));
