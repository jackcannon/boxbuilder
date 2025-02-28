import { Geom3, Geometry } from '@jscad/modeling/src/geometries/types';
import { cuboid, CuboidOptions } from '@jscad/modeling/src/primitives';
import { intersect, subtract, union } from '@jscad/modeling/src/operations/booleans';
import { transforms } from '@jscad/modeling';

import { FormObject } from '../form/schema';
import { CVec3, ff, ffO, vec3 } from '../utils';
import { calculateSegments, limitRadius } from './geometryUtils';
import { roundedCuboidExtruded } from './customShapes';
import { Vec3 } from '@jscad/modeling/src/maths/vec3';
import { colorize, hexToRgb } from '@jscad/modeling/src/colors';
import { colours } from '../constants';
import { ArrayTools } from 'swiss-ak';
import { LidType } from '../form/selectionTypes';

type PartConfig = { size: CVec3; r: number };
type CalcedVariables = ReturnType<typeof calculateVariables>;

enum DimensionType {
  SECTION = 0,
  INNER = 1,
  OUTER = 2
}

const calculateVariables = (form: FormObject, isPreview: boolean) => {
  const gap = form.spacing / 2; // amount of spacing from centre for each part
  const lidThick = form.lidThickness;
  const lidDepth = form.lidDepth;
  const lidHang = form.lidOverhang;

  const intWallThick = Math.max(0, form.internalWallThickness);
  const sectAcross = intWallThick <= 0 ? 1 : Math.max(1, form.sectionsAcross);
  const sectDeep = intWallThick <= 0 ? 1 : Math.max(1, form.sectionsDeep);

  const dimensionType = DimensionType[form.dimensionType] as keyof typeof DimensionType;
  const lidType = LidType[form.lidType] as keyof typeof LidType;

  const flrThick = form.wallThickness; // may be it's own variable one day

  // ensure the combined wall thickness won't exceed the smallest dimension
  const smallestDimension = Math.min(form.width, form.depth);

  // ensure the lid tolerance won't exceed the smallest dimension
  const lidTol = Math.min(form.lidTolerance, smallestDimension / 2);

  const thicknessLimit = ff((smallestDimension - lidTol - lidTol) / 2);
  const wllThick = Math.max(0, dimensionType === 'OUTER' ? Math.min(form.wallThickness, thicknessLimit) : form.wallThickness);
  const lidWllThick = form.lidType === LidType.INSERT ? Math.min(form.lidWallThickness, thicknessLimit) : form.lidWallThickness;
  const cornerRadius = form.cornerRadius <= 0 ? -wllThick : form.cornerRadius; // if 0, dont ever round corners

  // if (dimensionType === 'OUTER')
  let width = form.width;
  let depth = form.depth;
  let height = form.height - lidThick - lidTol;
  let radius = cornerRadius;

  // normalised dimensions of OUTER dimensions (of the box, not including lid)
  if (dimensionType === 'INNER') {
    const lidCutoutOffset = form.lidCutout ? 0 : lidDepth;

    // add outer wall thickness to get the outer dimensions
    width = form.width + wllThick + wllThick;
    depth = form.depth + wllThick + wllThick;
    height = form.height + flrThick + lidCutoutOffset - lidTol;
    radius = cornerRadius + wllThick;
  } else if (dimensionType === 'SECTION') {
    const lidCutoutOffset = form.lidCutout ? 0 : lidDepth;

    width = (form.width + intWallThick) * sectAcross - intWallThick + wllThick + wllThick;
    depth = (form.depth + intWallThick) * sectDeep - intWallThick + wllThick + wllThick;

    height = form.height + flrThick + lidCutoutOffset - lidTol;
    radius = cornerRadius + wllThick;
  }

  const lidInnerDepth = form.lidType === LidType.COVER ? Math.min(form.lidInnerDepth, height - flrThick, height - lidDepth) : 0;

  // sizing offsets on the x/y plane
  const xyOffsets = ffO({
    boxOuter: 0,
    boxInner: (0 - wllThick) * 2,
    insertLidWallOuter: (0 - wllThick - lidTol) * 2,
    insertLidWallInner: (0 - wllThick - lidTol - lidWllThick) * 2,
    insertLidTopOuter: lidHang * 2,
    coverLidWallOuter: (lidTol + lidWllThick) * 2,
    coverLidWallInner: lidTol * 2,
    coverLidSeatInner: -wllThick * 2
  });

  // main part sizes
  const getPartConfig = (id: keyof typeof xyOffsets, z: number, r: number = radius + xyOffsets[id] / 2): PartConfig => {
    let radius = form.cornerRadius <= 0 ? 0 : ff(r);
    return {
      size: vec3({ x: width + xyOffsets[id], y: depth + xyOffsets[id], z }),
      r: radius
    };
  };
  const sizes: { [K in keyof typeof xyOffsets]: PartConfig } = {
    boxOuter: getPartConfig('boxOuter', height - lidInnerDepth),
    boxInner: getPartConfig('boxInner', height - lidInnerDepth),
    insertLidWallOuter: getPartConfig('insertLidWallOuter', lidDepth),
    insertLidWallInner: getPartConfig('insertLidWallInner', height * 10),
    insertLidTopOuter: getPartConfig('insertLidTopOuter', lidThick, Math.max(lidHang, radius + xyOffsets.insertLidTopOuter / 2)),
    coverLidWallOuter: getPartConfig('coverLidWallOuter', lidThick + lidDepth + lidInnerDepth),
    coverLidWallInner: getPartConfig('coverLidWallInner', height * 10),
    coverLidSeatInner: getPartConfig('coverLidSeatInner', height * 10)
  };

  // rounded corner segments
  const outerMostSize = {
    [LidType.INSERT]: 'insertLidTopOuter',
    [LidType.COVER]: 'coverLidWallOuter'
  }[form.lidType] as keyof typeof xyOffsets;
  const largestRadius = limitRadius(sizes[outerMostSize].r, sizes[outerMostSize].size[0], sizes[outerMostSize].size[1]);
  const segments = calculateSegments(isPreview, largestRadius);

  // internal walls
  const boxInner = sizes.boxInner.size;
  const maxIntWallHeight = {
    [LidType.INSERT]: height - flrThick - lidDepth - lidTol,
    [LidType.COVER]: height - flrThick - lidInnerDepth - lidTol
  }[form.lidType as LidType];
  const intWallHeight = Math.min(maxIntWallHeight, form.internalWallHeight);
  const internalWalls: CuboidOptions[] = [
    // x
    ...ArrayTools.range(sectAcross - 1).map((i) => {
      const size = vec3({ x: intWallThick, y: boxInner.y + wllThick, z: intWallHeight });
      const total = boxInner.x + intWallThick;
      const x = (total / sectAcross) * (i + 1) - total / 2;
      const opts: CuboidOptions = {
        size,
        center: vec3({ x, y: 0, z: size.z / 2 + flrThick })
      };
      return opts;
    }),
    // y
    ...ArrayTools.range(sectDeep - 1).map((i) => {
      const size = vec3({ x: boxInner.x + wllThick, y: intWallThick, z: intWallHeight });
      const total = boxInner.y + intWallThick;
      const y = (total / sectDeep) * (i + 1) - total / 2;
      const opts: CuboidOptions = {
        size,
        center: vec3({ x: 0, y, z: size.z / 2 + flrThick })
      };
      return opts;
    })
  ];

  const { boxTranslate, lidRotate, lidTranslate } = (() =>
    form.isPrintMode
      ? {
          // transforms for print in place
          boxTranslate: vec3({ x: -width / 2 - gap, y: 0, z: 0 }),
          lidRotate: [0, 0, 0] as Vec3,
          lidTranslate: vec3({ x: sizes[outerMostSize].size[0] / 2 + gap, y: 0, z: 0 })
        }
      : {
          // transforms for 'joined' (lid sits on top)
          boxTranslate: vec3({ x: 0, y: 0, z: 0 }),
          lidRotate: [0, Math.PI, 0] as Vec3,
          lidTranslate: vec3({ x: 0, y: 0, z: height + lidTol + lidThick })
        })();

  return {
    isPreview,

    width,
    depth,
    height,

    flrThick,
    wllThick,
    gap,

    lidType,
    lidDepth,
    lidHang,
    lidThick,
    lidTol,
    lidInnerDepth,

    segments,
    sizes,
    internalWalls,

    boxTranslate,
    lidRotate,
    lidTranslate
  };
};

const getMainBoxGeometry = (form: FormObject, variables: CalcedVariables): Geom3 => {
  const { height, flrThick, segments, sizes, internalWalls, boxTranslate } = variables;

  const boxOuter = roundedCuboidExtruded({
    size: sizes.boxOuter.size,
    roundRadius: sizes.boxOuter.r,
    segments,
    center: vec3({ x: 0, y: 0, z: sizes.boxOuter.size[2] / 2 })
  });
  const boxInner = roundedCuboidExtruded({
    size: sizes.boxInner.size,
    center: vec3({ x: 0, y: 0, z: sizes.boxOuter.size[2] / 2 + flrThick }),
    roundRadius: sizes.boxInner.r,
    segments
  });

  let box = subtract(boxOuter, boxInner);

  if (internalWalls.length > 0) {
    box = union(box, ...internalWalls.map((opts) => cuboid(opts)));
  }
  if (sizes.boxOuter.r > 0) {
    box = intersect(box, boxOuter);
  }

  return transforms.translate(boxTranslate, box);
};

const getInsertLidGeometry = (form: FormObject, variables: CalcedVariables): Geom3 => {
  const { lidDepth, lidHang, lidThick, segments, sizes, lidRotate, lidTranslate } = variables;

  return transforms.translate(
    lidTranslate,
    transforms.rotate(
      lidRotate,
      union(
        subtract(
          // lid wall outer
          roundedCuboidExtruded({
            size: sizes.insertLidWallOuter.size,
            center: vec3({ x: 0, y: 0, z: lidThick + lidDepth / 2 }),
            roundRadius: sizes.insertLidWallOuter.r,
            segments
          }),
          // lid wall inner (cutout)
          (() => {
            if (!form.lidCutout || sizes.insertLidWallInner.size[0] <= 0 || sizes.insertLidWallInner.size[1] <= 0) {
              // if the cutout is invalid, don't cut anything out
              return cuboid({ size: [0, 0, 0] });
            }

            return roundedCuboidExtruded({
              size: sizes.insertLidWallInner.size,
              center: vec3({ x: 0, y: 0, z: (lidThick + lidDepth) / 2 }),
              roundRadius: sizes.insertLidWallInner.r,
              segments
            });
          })()
        ),
        // lid top
        roundedCuboidExtruded({
          size: sizes.insertLidTopOuter.size,
          center: vec3({ x: 0, y: 0, z: lidThick / 2 }),
          // always rounds the corners of the lid to at least the lidOverhang
          roundRadius: Math.max(lidHang, sizes.insertLidTopOuter.r),
          segments
        })
      )
    )
  );
};

const getCoverLidGeometry = (form: FormObject, variables: CalcedVariables): Geom3 => {
  const { lidInnerDepth, lidThick, segments, sizes, lidRotate, lidTranslate } = variables;

  return transforms.translate(
    lidTranslate,
    transforms.rotate(
      lidRotate,

      subtract(
        // lid wall outer
        roundedCuboidExtruded({
          size: sizes.coverLidWallOuter.size,
          center: vec3({ x: 0, y: 0, z: sizes.coverLidWallOuter.size[2] / 2 }),
          roundRadius: sizes.coverLidWallOuter.r,
          segments
        }),
        // lid wall inner
        roundedCuboidExtruded({
          size: sizes.coverLidWallInner.size,
          center: vec3({ x: 0, y: 0, z: sizes.coverLidWallInner.size[2] / 2 + lidThick + lidInnerDepth }),
          roundRadius: sizes.coverLidWallInner.r,
          segments
        }),

        // lid seat inner
        (() => {
          if (lidInnerDepth <= 0) {
            return cuboid({ size: [0, 0, 0] });
          }

          return roundedCuboidExtruded({
            size: sizes.coverLidSeatInner.size,
            center: vec3({ x: 0, y: 0, z: sizes.coverLidSeatInner.size[2] / 2 + lidThick }),
            roundRadius: sizes.coverLidSeatInner.r,
            segments
          });
        })()
      )
    )
  );
};

const applyCrossSection = (geometry: Geom3[], form: FormObject, variables: CalcedVariables): Geom3[] => {
  const { isPreview, width, depth, height, gap } = variables;

  if (form.isCrossSectionMode && isPreview) {
    const size = vec3({ x: gap * 2 + width * 4, y: gap * 2 + depth * 3, z: height * 3 });
    const center = vec3({ x: 0, y: -size[1] / 2, z: size[2] / 2 });
    const cutter = cuboid({ size, center });

    geometry = geometry.map((obj) => subtract(obj, cutter));
  }

  return geometry;
};

export const formToSolids = (form: FormObject, isPreview: boolean): Geometry[] => {
  const variables: CalcedVariables = calculateVariables(form, isPreview);

  try {
    let geometry = [
      // box
      getMainBoxGeometry(form, variables),
      // lid
      {
        [LidType.INSERT]: () => getInsertLidGeometry(form, variables),
        [LidType.COVER]: () => getCoverLidGeometry(form, variables)
      }[form.lidType as LidType]()
    ];

    geometry = applyCrossSection(geometry, form, variables);

    if (isPreview) {
      geometry = geometry.map((obj, index) => colorize(hexToRgb(colours[index % colours.length]), obj));
    }

    return geometry;
  } catch (e) {
    return [cuboid({ size: [1, 1, 1] })];
  }
};
