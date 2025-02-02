import { Vec3 } from '@jscad/modeling/src/maths/vec3';
import { IS_DEBUG } from './constants';

const powX = 1_000_000;

export type CVec3 = Vec3 & { x: number; y: number; z: number };

export const vec3 = ({ x, y, z }: { x: number; y: number; z: number }): CVec3 => {
  const arr: any = ffA([x, y, z]);
  arr.x = arr[0];
  arr.y = arr[1];
  arr.z = arr[2];
  return arr;
};

// fixFloat
export const ff = (num: number): number => Math.round(num * powX) / powX;

// fixFloatArray
export const ffA = <T = number[]>(nums: T, precision: number = 2): T => (nums as any).map((n: number) => ff(n));

// fixFloatObject
export const ffO = (obj: Record<string, number>, precision: number = 2): Record<string, number> =>
  Object.fromEntries(Object.entries(obj as any).map(([key, value]) => [key, ff(Number(value))]) as any) as Record<string, number>;

export const GET_DEBUG_TIMER = (...txt: string[]) => {
  const start = new Date().getTime();
  return {
    stop: () => {
      const end = new Date().getTime();
      if (IS_DEBUG) console.log(...txt, end - start);
    }
  };
};
