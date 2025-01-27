import { Geom3, Geometry } from '@jscad/modeling/src/geometries/types';
import { cuboid, cylinder, roundedCuboid } from '@jscad/modeling/src/primitives';
import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { Vec3 } from '@jscad/modeling/src/maths/vec3';
import { transforms } from '@jscad/modeling';

import { FormObject } from '../form/schema';
import { ff, ffA, ffO } from '../utils';

const NUM_SEGMENTS_PREVIEW = 8;
const NUM_SEGMENTS_EXPORT = 64;

const roundedCuboidFlat = (params: { size: Vec3; center?: Vec3; roundRadius?: number; segments?: number }): Geom3 => {
  const base: { size: Vec3; center: Vec3 } = {
    size: params.size ?? [1, 1, 1],
    center: params.center ?? [0, 0, 0]
  } as any;

  const segments = params.segments ?? NUM_SEGMENTS_PREVIEW;

  let radius = params.roundRadius;
  if (!radius || radius <= 0) return cuboid({ ...base });
  const minEdge = Math.min(base.size[0], base.size[1]);
  if (radius >= minEdge / 2) radius = minEdge / 2 - 0.01;
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
  const segments = isPreview ? NUM_SEGMENTS_PREVIEW : NUM_SEGMENTS_EXPORT;

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

  try {
    const geometry = [
      // the box
      transforms.translate(
        ffA([
          //
          -width / 2 - gap,
          0,
          height / 2
        ]),
        subtract(
          roundedCuboidFlat({
            size: ffA([
              //
              width + xyOffsets.boxOuter,
              depth + xyOffsets.boxOuter,
              height
            ]),
            roundRadius: radius + xyOffsets.boxOuter / 2,
            segments
          }),
          roundedCuboidFlat({
            size: ffA([
              //
              width + xyOffsets.boxInner,
              depth + xyOffsets.boxInner,
              height
            ]),
            center: ffA([
              //
              0,
              0,
              flrThick
            ]),
            roundRadius: radius + xyOffsets.boxInner / 2,
            segments
          })
        )
      ),

      // the lid
      transforms.translate(
        ffA([
          //
          width / 2 + lidHang + gap,
          0,
          lidThick
        ]),
        union(
          subtract(
            // lid wall outer
            roundedCuboidFlat({
              size: ffA([
                //
                width + xyOffsets.lidWallOuter,
                depth + xyOffsets.lidWallOuter,
                lidDepth
              ]),
              center: ffA([
                //
                0,
                0,
                lidDepth / 2
              ]),
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

              return roundedCuboidFlat({
                size: [
                  //
                  cutWidth,
                  cutDepth,
                  100
                ],
                center: ffA([
                  //
                  0,
                  0,
                  -lidThick / 2 + lidDepth / 2
                ]),
                roundRadius: radius + xyOffsets.lidWallInner / 2,
                segments
              });
            })()
          ),
          // lid top
          roundedCuboidFlat({
            size: ffA([
              //
              width + xyOffsets.lidTopOuter,
              depth + xyOffsets.lidTopOuter,
              lidThick
            ]),
            center: ffA([
              //
              0,
              0,
              -lidThick / 2
            ]),
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
