import { Geometry } from '@jscad/modeling/src/geometries/types';
import { cuboid } from '@jscad/modeling/src/primitives';
import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { transforms } from '@jscad/modeling';
import { FormObject } from '../form/schema';

export const formToSolids = (form: FormObject): Geometry[] => {
  // gap between the two shapes
  let gap = 3;
  let lidThick = form.lidThickness;
  // corner radius must be smaller than half the box dimensions
  let corner = Math.min(form.width / 2, form.depth / 2, form.height / 2);
  // thickness must be less than box dimensions
  let thick = Math.min(form.wallThickness, form.width - 0.1);
  let lidTol = form.lidTolerance;

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
            size: [form.width - thick, form.depth - thick, form.height],
            center: [0, 0, thick]
          })
        )
      ),
      // the lid
      transforms.translate(
        [form.width / 2 + gap, 0, lidThick / 2],
        union(
          subtract(
            cuboid({
              size: [form.width - thick - lidTol, form.depth - thick - lidTol, lidThick]
            }),
            cuboid({
              size: [form.width - thick - lidTol - thick, form.depth - thick - lidTol - thick, 20],
              center: [0, 0, -lidThick / 2 / 2 + lidThick / 2]
            })
          ),
          cuboid({
            size: [form.width, form.depth, lidThick / 2],
            center: [0, 0, -lidThick / 2 / 2]
          })
        )
      )
    ];
  } catch (e) {
    console.log(e);
    return [cuboid({ size: [1, 1, 1] })];
  }
};
