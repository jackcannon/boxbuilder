import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { cuboid, cylinder, roundedCuboid } from '@jscad/modeling/src/primitives';
import { scission, subtract, union } from '@jscad/modeling/src/operations/booleans';
import { Vec3 } from '@jscad/modeling/src/maths/vec3';

import { GET_DEBUG_TIMER } from '../utils';
import { translate } from '@jscad/modeling/src/operations/transforms';
import { boolToDir, limitRadius } from './geometryUtils';
import { NUM_SEGMENTS_PREVIEW } from '../constants';

export const roundedCuboidCustom = (params: { size: Vec3; center?: Vec3; roundRadius?: number; segments?: number }): Geom3 => {
  return roundedCuboidChoppedCyl(params);
};

/**
 * roundedCuboidSliced
 * Takes a roundedCuboid and cuts off the top and bottom
 * Wildly inefficient as the roundedCuboid also rounds the top edges and corners, despite us not needing them
 * 8 times as many roundedCuboid segments are generated than are needed
 */
const roundedCuboidSliced = (params: { size: Vec3; center?: Vec3; roundRadius?: number; segments?: number }): Geom3 => {
  const DEBUG_TIMER = GET_DEBUG_TIMER('roundedCuboidSliced');
  const base: { size: Vec3; center: Vec3 } = {
    size: params.size ?? [1, 1, 1],
    center: params.center ?? [0, 0, 0]
  } as any;

  const segments = params.segments ?? NUM_SEGMENTS_PREVIEW * 4;

  let radius = limitRadius(params.roundRadius ?? 0, base.size[0], base.size[1]);
  if (radius <= 0) return cuboid({ ...base });

  const { size, center } = base;

  const cutSize = [size[0] + 1, size[1] + 1, size[2] + radius + radius + 2] as Vec3;
  const cutCenterZOffset = size[2] / 2 + cutSize[2] / 2;

  const result = subtract(
    roundedCuboid({
      ...base,
      size: [size[0], size[1], size[2] + radius + radius] as Vec3,
      roundRadius: radius,
      segments
    }),
    cuboid({ size: cutSize, center: [center[0], center[1], center[2] + cutCenterZOffset] as Vec3 }),
    cuboid({ size: cutSize, center: [center[0], center[1], center[2] - cutCenterZOffset] as Vec3 })
  );
  DEBUG_TIMER.stop();
  return result;
};

/**
 * roundedCuboidJoined
 *
 * Takes 4 cylinders, and joins them in the middle with 2 cuboids
 * 3/4 of the cylinder segments are wasted
 * 3 times as many cylinder segments are generated than are needed
 */
const roundedCuboidJoined = (params: { size: Vec3; center?: Vec3; roundRadius?: number; segments?: number }): Geom3 => {
  const DEBUG_TIMER = GET_DEBUG_TIMER('roundedCuboidJoined');
  const base: { size: Vec3; center: Vec3 } = {
    size: params.size ?? [1, 1, 1],
    center: params.center ?? [0, 0, 0]
  } as any;

  const segments = params.segments ?? NUM_SEGMENTS_PREVIEW * 4;

  let radius = limitRadius(params.roundRadius ?? 0, base.size[0], base.size[1]);
  if (radius <= 0) return cuboid({ ...base });

  const { size, center } = base;

  const xOffset = size[0] / 2 - radius;
  const yOffset = size[1] / 2 - radius;

  const fillerOffset = radius * 2;
  const result = union(
    cylinder({ center: [center[0] + xOffset, center[1] + yOffset, center[2]], radius, height: size[2], segments }),
    cylinder({ center: [center[0] + xOffset, center[1] - yOffset, center[2]], radius, height: size[2], segments }),
    cylinder({ center: [center[0] - xOffset, center[1] + yOffset, center[2]], radius, height: size[2], segments }),
    cylinder({ center: [center[0] - xOffset, center[1] - yOffset, center[2]], radius, height: size[2], segments }),
    cuboid({ size: [size[0] - fillerOffset, size[1], size[2]], center }),
    cuboid({ size: [size[0], size[1] - fillerOffset, size[2]], center })
  );
  DEBUG_TIMER.stop();
  return result;
};

/**
 * roundedCuboidChoppedCyl
 *
 * Takes a cylinder, divides it into 4 parts, and moves them to the corner. Joined with 2 cuboids
 * Most efficient method, only generates the segments needed (minus a few for the cutters & cut sides)
 */
const roundedCuboidChoppedCyl = (params: { size: Vec3; center?: Vec3; roundRadius?: number; segments?: number }): Geom3 => {
  const DEBUG_TIMER = GET_DEBUG_TIMER('roundedCuboidChoppedCyl');
  const base: { size: Vec3; center: Vec3 } = {
    size: params.size ?? [1, 1, 1],
    center: params.center ?? [0, 0, 0]
  } as any;

  const segments = params.segments ?? NUM_SEGMENTS_PREVIEW * 4;

  let radius = limitRadius(params.roundRadius ?? 0, base.size[0], base.size[1]);
  if (radius <= 0) return cuboid({ ...base });

  const { size, center } = base;

  // The cutters have to have a size, but it's so small it's not visible
  // TODO idea - add check to make sure corners.length is 4, and re-cut with a larger cutter if not
  const cutterSize = 0.005;

  // const dirs = [[1, 1],[-1, 1],[-1, -1],[1, -1]];

  const corners = scission(
    subtract(
      cylinder({
        center,
        height: size[2],
        radius: radius,
        segments
      }),
      union(
        // cutters
        cuboid({ size: [radius * 4, cutterSize, size[2] * 2], center }),
        cuboid({ size: [cutterSize, radius * 4, size[2] * 2], center })
      )
    )
  ).map((geom, index) => {
    const examplePoint = geom.polygons[0].vertices[0];

    const xDist = size[0] / 2 - radius;
    const yDist = size[1] / 2 - radius;
    const xDir = boolToDir(examplePoint[0] > center[0]);
    const yDir = boolToDir(examplePoint[1] > center[1]);
    // const xDir = dirs[index][0];
    // const yDir = dirs[index][1];
    return translate([center[0] + xDist * xDir, center[1] + yDist * yDir, 0], geom);
  });

  const fillerOffset = radius * 2 - cutterSize;
  const result = union(
    ...corners,
    cuboid({ size: [size[0] - fillerOffset, size[1], size[2]], center }),
    cuboid({ size: [size[0], size[1] - fillerOffset, size[2]], center })
  );
  DEBUG_TIMER.stop();
  return result;
};
