import { useEffect, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { Geom3 } from '@jscad/modeling/src/geometries/types';

import { FormObject } from '../form/schema';
import { formToSolids } from '../geometry/formToSolids';
import { GET_DEBUG_TIMER } from '../utils';

import { BuildPlate, X1C_BUILD_PLATE } from './BuildPlate';
import { BuildVolumeGrid } from './BuildVolumeGrid';
import { solidsToBufferGeometries } from './solidsToBufferGeometries';

interface Props {
  form: FormObject;
}

export const BoxModel = ({ form }: Props) => {
  const [debouncedForm] = useDebounce(form, 50);

  const meshes = useMemo(() => {
    const DEBUG_TIMER = GET_DEBUG_TIMER('formToSolids - CadRender');
    const solids = formToSolids(debouncedForm, true) as Geom3[];
    DEBUG_TIMER.stop();
    return solidsToBufferGeometries(solids);
  }, [debouncedForm]);

  useEffect(
    () => () => {
      for (const mesh of meshes) mesh.geometry.dispose();
    },
    [meshes]
  );

  return (
    <>
      <BuildPlate width={X1C_BUILD_PLATE.width} depth={X1C_BUILD_PLATE.depth} />

      <group position={[0, 0, 0.01]}>
        <BuildVolumeGrid width={X1C_BUILD_PLATE.width} depth={X1C_BUILD_PLATE.depth} />
      </group>

      {meshes.map((mesh, index) => (
        <mesh key={index} geometry={mesh.geometry} renderOrder={1}>
          <meshPhongMaterial color={mesh.color} flatShading shininess={12} specular="#3a3a3a" />
        </mesh>
      ))}
    </>
  );
};
