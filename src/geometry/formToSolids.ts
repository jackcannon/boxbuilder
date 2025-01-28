import { Geometry } from '@jscad/modeling/src/geometries/types';
import { cuboid } from '@jscad/modeling/src/primitives';
import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { transforms } from '@jscad/modeling';

import { FormObject } from '../form/schema';
import { ff, ffA, ffO, vec3 } from '../utils';
import { calculateSegments, limitRadius } from './geometryUtils';
import { roundedCuboidExtruded } from './customShapes';
import { Vec3 } from '@jscad/modeling/src/maths/vec3';

type PartConfig = { size: Vec3; r: number };

const isPrintInPlace = true;
const isCrossSection = false;

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
  const lidCutoutOffset = form.lidCutout ? 0 : lidDepth;
  const height = isOuter ? form.height - lidThick - lidTol : form.height + flrThick + lidCutoutOffset - lidTol;
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

  const getPartConfig = (id: keyof typeof xyOffsets, z: number, r: number = radius + xyOffsets[id] / 2): PartConfig => ({
    size: vec3({ x: width + xyOffsets[id], y: depth + xyOffsets[id], z }),
    r
  });
  const sizes: { [K in keyof typeof xyOffsets]: PartConfig } = {
    boxOuter: getPartConfig('boxOuter', height),
    boxInner: getPartConfig('boxInner', height),
    lidWallOuter: getPartConfig('lidWallOuter', lidDepth),
    lidWallInner: getPartConfig('lidWallInner', height * 3),
    lidTopOuter: getPartConfig('lidTopOuter', lidThick, Math.max(lidHang, radius + xyOffsets.lidTopOuter / 2))
  };

  // the limited radius of the lid top outer
  const largestRadius = limitRadius(sizes.lidTopOuter.r, sizes.lidTopOuter.size[0], sizes.lidTopOuter.size[1]);
  const segments = calculateSegments(isPreview, largestRadius);

  try {
    const { boxTranslate, lidRotate, lidTranslate } = (() =>
      isPrintInPlace
        ? {
            // transforms for print in place
            boxTranslate: vec3({ x: -width / 2 - gap, y: 0, z: 0 }),
            lidRotate: [0, 0, 0] as Vec3,
            lidTranslate: vec3({ x: width / 2 + lidHang + gap, y: 0, z: 0 })
          }
        : {
            // transforms for 'joined' (lid sits on top)
            boxTranslate: vec3({ x: 0, y: 0, z: 0 }),
            lidRotate: [0, Math.PI, 0] as Vec3,
            lidTranslate: vec3({ x: 0, y: 0, z: height + lidTol + lidThick })
          })();

    const geometry = [
      // box
      transforms.translate(
        boxTranslate,
        subtract(
          // box outer
          roundedCuboidExtruded({
            size: sizes.boxOuter.size,
            roundRadius: sizes.boxOuter.r,
            segments,
            center: vec3({ x: 0, y: 0, z: height / 2 })
          }),
          // box inner
          roundedCuboidExtruded({
            size: sizes.boxInner.size,
            center: vec3({ x: 0, y: 0, z: height / 2 + flrThick }),
            roundRadius: sizes.boxInner.r,
            segments
          })
        )
      ),
      // lid
      transforms.translate(
        lidTranslate,
        transforms.rotate(
          lidRotate,
          union(
            subtract(
              // lid wall outer
              roundedCuboidExtruded({
                size: sizes.lidWallOuter.size,
                center: vec3({ x: 0, y: 0, z: lidThick + lidDepth / 2 }),
                roundRadius: sizes.lidWallOuter.r,
                segments
              }),
              // lid wall inner (cutout)
              (() => {
                // if the cutout is invalid, don't cut out anything
                if (!form.lidCutout || sizes.lidWallInner.size[0] <= 0 || sizes.lidWallInner.size[1] <= 0) {
                  return cuboid({ size: [0, 0, 0] });
                }

                return roundedCuboidExtruded({
                  size: sizes.lidWallInner.size,
                  center: vec3({ x: 0, y: 0, z: lidThick / 2 + lidDepth / 2 }),
                  roundRadius: sizes.lidWallInner.r,
                  segments
                });
              })()
            ),
            // lid top
            roundedCuboidExtruded({
              size: sizes.lidTopOuter.size,
              center: vec3({ x: 0, y: 0, z: lidThick / 2 }),
              // always rounds the corners of the lid to at least the lidOverhang
              roundRadius: Math.max(lidHang, sizes.lidTopOuter.r),
              segments
            })
          )
        )
      )
    ];

    if (isCrossSection) {
      const size = vec3({ x: gap * 2 + width * 3, y: gap * 2 + depth * 3, z: height * 3 });
      const center = vec3({ x: 0, y: -size[1] / 2, z: size[2] / 2 });
      const cutter = cuboid({ size, center });

      return geometry.map((obj) => subtract(obj, cutter));
    }

    return geometry;
  } catch (e) {
    console.log(e);
    return [cuboid({ size: [1, 1, 1] })];
  }
};
