import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { cuboid, roundedRectangle } from '@jscad/modeling/src/primitives';
import { Vec3 } from '@jscad/modeling/src/maths/vec3';

import { GET_DEBUG_TIMER } from '../utils';
import { translate } from '@jscad/modeling/src/operations/transforms';
import { calculateSegments, limitRadius } from './geometryUtils';
import { extrudeLinear } from '@jscad/modeling/src/operations/extrusions';

export const roundedCuboidExtruded = (params: { size: Vec3; center?: Vec3; roundRadius?: number; segments?: number }): Geom3 => {
  const DEBUG_TIMER = GET_DEBUG_TIMER('roundedCuboidExtruded');
  const base: { size: Vec3; center: Vec3 } = {
    size: params.size ?? [1, 1, 1],
    center: params.center ?? [0, 0, 0]
  } as any;

  const segments = params.segments ?? calculateSegments(true, params.roundRadius ?? 0);

  let radius = limitRadius(params.roundRadius ?? 0, base.size[0], base.size[1]);
  if (radius <= 0) return cuboid({ ...base });

  const { size, center } = base;

  const rect = roundedRectangle({
    size: [size[0], size[1]],
    center: [center[0], center[1]],
    roundRadius: radius,
    segments
  });

  const cubd = extrudeLinear({ height: size[2] }, rect);
  const translated = translate([0, 0, -(size[2] / 2) + center[2]], cubd);

  const result = translated;
  DEBUG_TIMER.stop();
  return result;
};
