import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { fromPoints, toPolygons } from '@jscad/modeling/src/geometries/geom3';
import { cuboid } from '@jscad/modeling/src/primitives';
import { Vec3 } from '@jscad/modeling/src/maths/vec3';

import type { Manifold, ManifoldToplevel, Mesh } from 'manifold-3d';

/** Snapping precision (decimal places) used to weld coincident vertices before handing triangles to Manifold. */
const WELD_PRECISION = 1e5;

type BooleanOp = 'subtract' | 'union' | 'intersect';

/**
 * Triangulates a Geom3 into flat vertex/index buffers, welding vertices that
 * are within weld precision of each other so shared edges between leaf solids
 * (which JSCAD tessellates independently) become topologically connected.
 */
const geom3ToMesh = (solid: Geom3): { vertProperties: Float32Array; triVerts: Uint32Array } => {
  const polygons = toPolygons(solid);

  const vertexIndexByKey = new Map<string, number>();
  const vertexPositions: number[] = [];
  const triangleIndices: number[] = [];

  const roundCoord = (value: number) => Math.round(value * WELD_PRECISION) / WELD_PRECISION;
  const getVertexIndex = (point: Vec3): number => {
    const key = `${roundCoord(point[0])},${roundCoord(point[1])},${roundCoord(point[2])}`;
    let index = vertexIndexByKey.get(key);
    if (index === undefined) {
      index = vertexPositions.length / 3;
      vertexIndexByKey.set(key, index);
      vertexPositions.push(point[0], point[1], point[2]);
    }
    return index;
  };

  for (const polygon of polygons) {
    const vertices = polygon.vertices;
    for (let i = 1; i < vertices.length - 1; i++) {
      const a = getVertexIndex(vertices[0]);
      const b = getVertexIndex(vertices[i]);
      const c = getVertexIndex(vertices[i + 1]);
      if (a !== b && b !== c && a !== c) triangleIndices.push(a, b, c);
    }
  }

  return {
    vertProperties: new Float32Array(vertexPositions),
    triVerts: new Uint32Array(triangleIndices)
  };
};

/** Converts a Geom3 into a Manifold, or null if the solid has no volume (e.g. a placeholder zero-size cuboid). */
const geom3ToManifold = (wasm: ManifoldToplevel, solid: Geom3): Manifold | null => {
  const { vertProperties, triVerts } = geom3ToMesh(solid);
  if (triVerts.length === 0) return null;

  const mesh: Mesh = new wasm.Mesh({ numProp: 3, vertProperties, triVerts });
  mesh.merge();

  const manifold = new wasm.Manifold(mesh);
  if (manifold.isEmpty()) {
    manifold.delete();
    return null;
  }
  return manifold;
};

/** Converts a Manifold's mesh back into a Geom3, one triangle per polygon. */
const manifoldToGeom3 = (manifold: Manifold): Geom3 => {
  const mesh = manifold.getMesh();
  const { numProp, vertProperties, triVerts, numTri } = mesh;

  const polygonPoints: Vec3[][] = [];
  for (let t = 0; t < numTri; t++) {
    const points: Vec3[] = [];
    for (let j = 0; j < 3; j++) {
      const vertexIndex = triVerts[t * 3 + j];
      points.push([
        vertProperties[vertexIndex * numProp],
        vertProperties[vertexIndex * numProp + 1],
        vertProperties[vertexIndex * numProp + 2]
      ]);
    }
    polygonPoints.push(points);
  }

  return fromPoints(polygonPoints);
};

/** Empty Geom3, used when a boolean op's result has no volume. */
const emptyGeom3 = (): Geom3 => cuboid({ size: [0, 0, 0] });

/**
 * Folds a list of Geom3 solids through the given boolean op using Manifold,
 * mirroring the left-to-right fold semantics of the matching `@jscad/modeling`
 * booleans (e.g. `subtract(a, b, c)` === `(a - b) - c`).
 */
const foldManifoldOp = (wasm: ManifoldToplevel, op: BooleanOp, geometries: Geom3[]): Geom3 => {
  if (geometries.length === 0) throw new Error('wrong number of arguments');

  let acc: Manifold | null = null;
  let initialised = false;

  for (const geometry of geometries) {
    const operand = geom3ToManifold(wasm, geometry);

    if (!initialised) {
      acc = operand;
      initialised = true;
      continue;
    }

    if (op === 'subtract') {
      // a - empty = a
      if (operand === null) continue;
      if (acc === null) {
        operand.delete();
        continue;
      }
      const next = acc.subtract(operand);
      acc.delete();
      operand.delete();
      acc = next;
    } else if (op === 'union') {
      // a + empty = a
      if (operand === null) continue;
      if (acc === null) {
        acc = operand;
        continue;
      }
      const next = acc.add(operand);
      acc.delete();
      operand.delete();
      acc = next;
    } else {
      // intersect with empty = empty
      if (acc === null) {
        if (operand !== null) operand.delete();
        continue;
      }
      if (operand === null) {
        acc.delete();
        acc = null;
        continue;
      }
      const next = acc.intersect(operand);
      acc.delete();
      operand.delete();
      acc = next;
    }
  }

  if (acc === null) return emptyGeom3();

  const result = manifoldToGeom3(acc);
  acc.delete();
  return result;
};

/** Boolean ops bound to a specific, already-initialised Manifold WASM module. */
export interface ManifoldBooleanBackend {
  subtract: (...geometries: Geom3[]) => Geom3;
  union: (...geometries: Geom3[]) => Geom3;
  intersect: (...geometries: Geom3[]) => Geom3;
}

export const createManifoldBooleanBackend = (wasm: ManifoldToplevel): ManifoldBooleanBackend => ({
  subtract: (...geometries: Geom3[]) => foldManifoldOp(wasm, 'subtract', geometries),
  union: (...geometries: Geom3[]) => foldManifoldOp(wasm, 'union', geometries),
  intersect: (...geometries: Geom3[]) => foldManifoldOp(wasm, 'intersect', geometries)
});

/**
 * Loads the Manifold WASM module in a Vite-friendly way: the `?url` import
 * resolves to the `manifold-3d/manifold.wasm` asset URL at build time, so
 * Manifold can locate its binary without relying on Emscripten's default
 * `import.meta.url`-relative lookup (which doesn't survive bundling).
 */
const loadManifoldModule = async (): Promise<ManifoldToplevel> => {
  const [{ default: Module }, { default: wasmUrl }] = await Promise.all([
    import('manifold-3d'),
    import('manifold-3d/manifold.wasm?url')
  ]);

  const wasm = await Module({ locateFile: () => wasmUrl });
  wasm.setup();
  return wasm;
};

let backendPromise: Promise<ManifoldBooleanBackend> | null = null;

/** Lazily loads the Manifold WASM module and returns booleans bound to it. Safe to call repeatedly; the module is only loaded once. */
export const getManifoldBooleanBackend = (): Promise<ManifoldBooleanBackend> => {
  if (!backendPromise) {
    backendPromise = loadManifoldModule().then(createManifoldBooleanBackend);
  }
  return backendPromise;
};
