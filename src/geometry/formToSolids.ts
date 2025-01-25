import { Geometry } from '@jscad/modeling/src/geometries/types';
import { cuboid } from '@jscad/modeling/src/primitives';
import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { transforms } from '@jscad/modeling';
import { FormObject } from '../form/schema';

export const formToSolids = (form: FormObject): Geometry[] => {
  // gap between the two shapes
  const gap = form.spacing;
  const lidThick = form.lidThickness;
  const lidDepth = form.lidDepth;
  const lidTol = form.lidTolerance;

  // thickness must be less than box dimensions
  const wllThick = Math.min(form.wallThickness, form.width - 0.1);

  try {
    return [
      // the box
      transforms.translate(
        [-form.width / 2 - gap, 0, form.height / 2],
        subtract(
          cuboid({
            size: [form.width, form.depth, form.height]
          }),
          cuboid({
            size: [form.width - wllThick, form.depth - wllThick, form.height],
            center: [0, 0, wllThick]
          })
        )
      ),

      // the lid
      transforms.translate(
        [
          //
          form.width / 2 + gap,
          0,
          lidThick / 2
        ],
        union(
          subtract(
            cuboid({
              // lid wall outer
              size: [
                //
                form.width - wllThick - lidTol,
                form.depth - wllThick - lidTol,
                lidDepth
              ],
              center: [
                //
                0,
                0,
                lidDepth / 2
              ]
            }),
            cuboid({
              // lid wall inner (cutout)
              size: [
                //
                form.width - wllThick - lidTol - wllThick,
                form.depth - wllThick - lidTol - wllThick,
                100
              ],
              center: [
                //
                0,
                0,
                -lidThick / 2 / 2 + lidDepth / 2
              ]
            })
          ),
          // lid top
          cuboid({
            size: [
              //
              form.width,
              form.depth,
              lidThick / 2
            ],
            center: [
              //
              0,
              0,
              -lidThick / 2 / 2
            ]
          })
        )
      )
    ];
  } catch (e) {
    console.log(e);
    return [cuboid({ size: [1, 1, 1] })];
  }
};
