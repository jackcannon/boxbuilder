import { toPolygons } from '@jscad/modeling/src/geometries/geom3';
import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { BufferAttribute, BufferGeometry } from 'three';

export type SolidMeshData = {
  geometry: BufferGeometry;
  color: string;
};

const FALLBACK_COLOR = '#888888';

/**
 * Convert JSCAD Geom3 solids into Three.js BufferGeometries for R3F preview.
 * Does not mutate the input solids.
 */
export const solidsToBufferGeometries = (solids: Geom3[]): SolidMeshData[] =>
  solids.map((solid) => {
    const polygons = toPolygons(solid);
    const positions: number[] = [];

    for (const poly of polygons) {
      const verts = poly.vertices;
      for (let i = 1; i < verts.length - 1; i++) {
        const a = verts[0];
        const b = verts[i];
        const c = verts[i + 1];
        positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    geometry.computeVertexNormals();

    const rgb = solid.color;
    let color = FALLBACK_COLOR;
    if (rgb && rgb.length >= 3) {
      const toHex = (c: number) =>
        Math.max(0, Math.min(255, Math.round(c * 255)))
          .toString(16)
          .padStart(2, '0');
      color = `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
    }

    return { geometry, color };
  });
