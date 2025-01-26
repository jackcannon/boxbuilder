import { Geometry } from '@jscad/modeling/src/geometries/types';
import { cuboid } from '@jscad/modeling/src/primitives';
import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { transforms } from '@jscad/modeling';
import { FormObject } from '../form/schema';
import { ff, ffA } from '../utils';

export const formToSolids = (form: FormObject): Geometry[] => {
  // gap between the two shapes
  const gap = form.spacing;
  const lidThick = form.lidThickness;
  const lidDepth = form.lidDepth;

  const isOuter = form.isOuterDimensions;

  const flrThick = form.wallThickness; // may be it's own variable one day

  // ensure the combined wall thickness won't exceed the smallest dimension
  const smallestDimension = Math.min(form.width, form.depth);

  // ensure the lid tolerance won't exceed the smallest dimension
  const lidTol = Math.min(form.lidTolerance, smallestDimension / 2);

  const thicknessLimit = ff((smallestDimension - lidTol - lidTol) / 2);
  const wllThick = Math.max(0, isOuter ? Math.min(form.wallThickness, thicknessLimit) : form.wallThickness);

  // normalise dimensions to get OUTER dimensions
  const width = isOuter ? form.width : form.width + wllThick + wllThick;
  const depth = isOuter ? form.depth : form.depth + wllThick + wllThick;
  const height = isOuter ? form.height : form.height + flrThick;

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
          cuboid({
            size: ffA([
              //
              width,
              depth,
              height
            ])
          }),
          cuboid({
            size: ffA([
              //
              width - wllThick - wllThick,
              depth - wllThick - wllThick,
              height
            ]),
            center: ffA([
              //
              0,
              0,
              flrThick
            ])
          })
        )
      ),

      // the lid
      transforms.translate(
        ffA([
          //
          width / 2 + gap,
          0,
          lidThick / 2
        ]),
        union(
          subtract(
            // lid wall outer
            cuboid({
              size: ffA([
                //
                ff(width - wllThick - wllThick - lidTol - lidTol),
                ff(depth - wllThick - wllThick - lidTol - lidTol),
                lidDepth
              ]),
              center: ffA([
                //
                0,
                0,
                lidDepth / 2
              ])
            }),
            // lid wall inner (cutout)
            (() => {
              const cutWidth = ff(width - wllThick - wllThick - lidTol - lidTol - wllThick - wllThick);
              const cutDepth = ff(depth - wllThick - wllThick - lidTol - lidTol - wllThick - wllThick);

              // if the cutout is invalid, don't cut out anything
              if (cutWidth <= 0 || cutDepth <= 0) {
                return cuboid({ size: [0, 0, 0] });
              }

              return cuboid({
                size: ffA([
                  //
                  width - wllThick - wllThick - lidTol - lidTol - wllThick - wllThick,
                  depth - wllThick - wllThick - lidTol - lidTol - wllThick - wllThick,
                  100
                ]),
                center: ffA([
                  //
                  0,
                  0,
                  -lidThick / 2 / 2 + lidDepth / 2
                ])
              });
            })()
          ),
          // lid top
          cuboid({
            size: ffA([
              //
              width,
              depth,
              lidThick / 2
            ]),
            center: ffA([
              //
              0,
              0,
              -lidThick / 2 / 2
            ])
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
