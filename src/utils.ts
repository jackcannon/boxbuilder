const powX = 1_000_000;

// fixFloat
export const ff = (num: number): number => Math.round(num * powX) / powX;

// fixFloatArray
export const ffA = <T = number[]>(nums: T, precision: number = 2): T => (nums as any).map((n: number) => ff(n));

// fixFloatObject
export const ffO = (obj: Record<string, number>, precision: number = 2): Record<string, number> =>
  Object.fromEntries(Object.entries(obj as any).map(([key, value]) => [key, ff(Number(value))]) as any) as Record<string, number>;
