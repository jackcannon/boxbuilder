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
