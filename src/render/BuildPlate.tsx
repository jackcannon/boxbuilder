import { useRef } from 'react';
import { MeshBasicMaterial } from 'three';

import { useHideWhenViewedFromBelow } from './useHideWhenViewedFromBelow';

/** Bambu Lab X1C / P1 / A1 build plate size (mm) */
export const X1C_BUILD_PLATE = { width: 256, depth: 256 } as const;

interface Props {
  width?: number;
  depth?: number;
  margin?: number;
  thickness?: number;
}

const VISIBLE_OPACITY = 0.92;

export const BuildPlate = ({
  width = X1C_BUILD_PLATE.width,
  depth = X1C_BUILD_PLATE.depth,
  margin = 5,
  thickness = 1
}: Props) => {
  const materialRef = useRef<MeshBasicMaterial>(null);
  const plateWidth = width + margin * 2;
  const plateDepth = depth + margin * 2;

  useHideWhenViewedFromBelow(materialRef, VISIBLE_OPACITY);

  return (
    <mesh position={[0, 0, -thickness / 2]} renderOrder={0}>
      <boxGeometry args={[plateWidth, plateDepth, thickness]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#191916"
        toneMapped={false}
        transparent
        opacity={VISIBLE_OPACITY}
        depthWrite={false}
      />
    </mesh>
  );
};
