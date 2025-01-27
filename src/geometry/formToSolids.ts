import { Geom3, Geometry } from '@jscad/modeling/src/geometries/types';
import { cuboid, roundedCuboid } from '@jscad/modeling/src/primitives';
import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { Vec3 } from '@jscad/modeling/src/maths/vec3';
import { transforms } from '@jscad/modeling';

import { FormObject } from '../form/schema';
import { ff, ffO, vec3 } from '../utils';

const NUM_SEGMENTS_PREVIEW = 2; // per corner
const NUM_SEGMENTS_EXPORT = 16; // per corner
const NUM_SEGMENTS_MAX = 64;
const TARGET_RESOLUTION = 0.5;

const calculateSegments = (isPreview: boolean = false, radius: number, resolution: number): number => {
  if (isPreview) return NUM_SEGMENTS_PREVIEW * 4;

  // remove this line if you want properly calculated segments
  return NUM_SEGMENTS_EXPORT * 4;

  const normalisedRadius = Math.max(0, Number(radius) || 0);
  const normalisedResolution = Math.max(0, Number(resolution) || 0);

  if (normalisedResolution === 0) return NUM_SEGMENTS_MAX;

  const circumference: number = 2 * Math.PI * normalisedRadius;
  const minSegments: number = Math.ceil(circumference / normalisedResolution);

  return Math.min(minSegments, NUM_SEGMENTS_MAX);
};

const limitRadius = (roundRadius: number, xSize: number, ySize: number): number => {
  let radius = roundRadius;
  if (radius <= 0) return 0;
  const minEdge = Math.min(xSize, ySize);
  const maxRadius = minEdge / 2 - 0.01;
  if (radius >= maxRadius) radius = maxRadius;
  return radius;
};

const roundedCuboidSliced = (params: { size: Vec3; center?: Vec3; roundRadius?: number; segments?: number }): Geom3 => {
  const base: { size: Vec3; center: Vec3 } = {
    size: params.size ?? [1, 1, 1],
    center: params.center ?? [0, 0, 0]
  } as any;

  const segments = params.segments ?? NUM_SEGMENTS_PREVIEW;

  let radius = limitRadius(params.roundRadius ?? 0, base.size[0], base.size[1]);
  if (radius <= 0) return cuboid({ ...base });

  const { size, center } = base;

  const cutSize = [size[0] + 1, size[1] + 1, size[2] + radius + radius + 2] as Vec3;
  const cutCenterZOffset = size[2] / 2 + cutSize[2] / 2;

  return subtract(
    roundedCuboid({
      ...base,
      size: [size[0], size[1], size[2] + radius + radius] as Vec3,
      roundRadius: radius,
      segments
    }),
    cuboid({ size: cutSize, center: [center[0], center[1], center[2] + cutCenterZOffset] as Vec3 }),
    cuboid({ size: cutSize, center: [center[0], center[1], center[2] - cutCenterZOffset] as Vec3 })
  );
};

export const formToSolids = (form: FormObject, isPreview: boolean): Geometry[] => {
  const gap = form.spacing / 2; // amount of spacing from centre for each part
  const lidThick = form.lidThickness;
  const lidDepth = form.lidDepth;
  const lidHang = form.lidOverhang;

  const isOuter = form.isOuterDimensions;

  const flrThick = form.wallThickness; // may be it's own variable one day

  // ensure the combined wall thickness won't exceed the smallest dimension
  const smallestDimension = Math.min(form.width, form.depth);

  // ensure the lid tolerance won't exceed the smallest dimension
  const lidTol = Math.min(form.lidTolerance, smallestDimension / 2);

  const thicknessLimit = ff((smallestDimension - lidTol - lidTol) / 2);
  const wllThick = Math.max(0, isOuter ? Math.min(form.wallThickness, thicknessLimit) : form.wallThickness);

  // normalise dimensions to get OUTER dimensions of the box
  const width = isOuter ? form.width : form.width + wllThick + wllThick;
  const depth = isOuter ? form.depth : form.depth + wllThick + wllThick;
  const height = isOuter ? form.height - lidThick : form.height + flrThick;
  const cornerRadius = form.cornerRadius <= 0 ? -wllThick : form.cornerRadius; // if 0, dont ever round corners
  const radius = isOuter ? cornerRadius : cornerRadius + wllThick;

  // sizing offsets on the x/y plane
  const xyOffsets = ffO({
    boxOuter: 0,
    boxInner: -wllThick - wllThick,
    lidWallOuter: -wllThick - wllThick - lidTol - lidTol,
    lidWallInner: -wllThick - wllThick - lidTol - lidTol - wllThick - wllThick,
    lidTopOuter: lidHang + lidHang
  });

  // the limited radius of the lid top outer
  const largestRadius = limitRadius(
    Math.max(lidHang, radius + xyOffsets.lidTopOuter / 2),
    width + xyOffsets.lidTopOuter,
    depth + xyOffsets.lidTopOuter
  );
  const segments = calculateSegments(isPreview, largestRadius, TARGET_RESOLUTION);

  try {
    const geometry = [
      // the box
      transforms.translate(
        vec3({
          x: -width / 2 - gap,
          y: 0,
          z: height / 2
        }),
        subtract(
          roundedCuboidSliced({
            size: vec3({
              x: width + xyOffsets.boxOuter,
              y: depth + xyOffsets.boxOuter,
              z: height
            }),
            roundRadius: radius + xyOffsets.boxOuter / 2,
            segments
          }),
          roundedCuboidSliced({
            size: vec3({
              x: width + xyOffsets.boxInner,
              y: depth + xyOffsets.boxInner,
              z: height
            }),
            center: vec3({
              x: 0,
              y: 0,
              z: flrThick
            }),
            roundRadius: radius + xyOffsets.boxInner / 2,
            segments
          })
        )
      ),

      // the lid
      transforms.translate(
        vec3({
          x: width / 2 + lidHang + gap,
          y: 0,
          z: lidThick
        }),
        union(
          subtract(
            // lid wall outer
            roundedCuboidSliced({
              size: vec3({
                x: width + xyOffsets.lidWallOuter,
                y: depth + xyOffsets.lidWallOuter,
                z: lidDepth
              }),
              center: vec3({
                x: 0,
                y: 0,
                z: lidDepth / 2
              }),
              roundRadius: radius + xyOffsets.lidWallOuter / 2,
              segments
            }),
            // lid wall inner (cutout)
            (() => {
              const cutWidth = ff(width + xyOffsets.lidWallInner);
              const cutDepth = ff(depth + xyOffsets.lidWallInner);

              // if the cutout is invalid, don't cut out anything
              if (cutWidth <= 0 || cutDepth <= 0) {
                return cuboid({ size: [0, 0, 0] });
              }

              return roundedCuboidSliced({
                size: vec3({
                  x: cutWidth,
                  y: cutDepth,
                  z: 100
                }),
                center: vec3({
                  x: 0,
                  y: 0,
                  z: -lidThick / 2 + lidDepth / 2
                }),
                roundRadius: radius + xyOffsets.lidWallInner / 2,
                segments
              });
            })()
          ),
          // lid top
          roundedCuboidSliced({
            size: vec3({
              x: width + xyOffsets.lidTopOuter,
              y: depth + xyOffsets.lidTopOuter,
              z: lidThick
            }),
            center: vec3({
              x: 0,
              y: 0,
              z: -lidThick / 2
            }),
            // always rounds the corners of the lid to at least the lidOverhang
            roundRadius: Math.max(lidHang, radius + xyOffsets.lidTopOuter / 2),
            segments
          })
        )
      )
    ];
    return geometry;
  } catch (e) {
    console.log(e);
    return [cuboid({ size: [1, 1, 1] })];
  }
};
