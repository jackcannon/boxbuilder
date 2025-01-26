// fixFloat
export const ff = (num: number, precision: number = 2): number => Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);

// fixFloatArray
export const ffA = <T = number[]>(nums: T, precision: number = 2): T => (nums as any).map((n: number) => ff(n, precision));
