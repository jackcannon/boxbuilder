import { Geometry } from '@jscad/modeling/src/geometries/types';
import { cuboid } from '@jscad/modeling/src/primitives';
import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { transforms } from '@jscad/modeling';
import { Box } from '../form/schema';

export const box_to_solids = (box: Box): Geometry[] => {
  // gap between the two shapes
  let gap = 3;
  let lid_thick = box.lidThickness;
  // corner radius must be smaller than half the box dimensions
  let corner = Math.min(box.width / 2, box.depth / 2, box.height / 2, box.cornerRadius);
  //thickness must be less than box dimensions
  let thick = Math.min(box.wallThickness, box.width - 0.1);
  let lid_tol = box.lidTolerance;

  try {
    return [
      // the box
      transforms.translate(
        [-box.width / 2 - gap, 0, box.height / 2],
        subtract(
          cuboid({
            size: [box.width, box.depth, box.height]
            // roundRadius: corner,
          }),
          cuboid({
            size: [box.width - thick, box.depth - thick, box.height],
            center: [0, 0, thick]
          })
        )
      ),
      // the lid
      transforms.translate(
        [box.width / 2 + gap, 0, lid_thick / 2],
        union(
          subtract(
            cuboid({
              size: [box.width - thick - lid_tol, box.depth - thick - lid_tol, lid_thick]
            }),
            cuboid({
              size: [box.width - thick - lid_tol - thick, box.depth - thick - lid_tol - thick, 20],
              center: [0, 0, -lid_thick / 2 / 2 + lid_thick / 2]
            })
          ),
          cuboid({
            size: [box.width, box.depth, lid_thick / 2],
            center: [0, 0, -lid_thick / 2 / 2]
          })
        )
      )
    ];
  } catch (e) {
    console.log(e);
    return [cuboid({ size: [1, 1, 1] })];
  }
};
