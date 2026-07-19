import { toPolygons } from '@jscad/modeling/src/geometries/geom3';
import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { Vec3 } from '@jscad/modeling/src/maths/vec3';
import { strToU8, zipSync } from 'fflate';

import { FormObject } from '../form/schema';
import { formToEffectiveExport } from '../form/exportState';
import { buildShareUrl } from '../form/shareUrl';
import { GET_DEBUG_TIMER } from '../utils';

import { useJscadBackend, useManifoldBackend } from './booleans';
import { ensureFileExtension, forceDownloadBlob } from './exportStl';
import { formToSolids } from './formToSolids';

/** Match Manifold weld precision so export topology stays watertight. */
const WELD_PRECISION = 1e5;

const OBJECT_NAMES = ['Box', 'Lid'] as const;

interface WeldedMesh {
  name: string;
  vertices: number[];
  triangles: number[];
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Triangulates a Geom3 into welded vertex/index buffers so shared edges keep
 * shared indices (required for slicers that flag open edges on 3MF meshes).
 *
 * @param {Geom3} solid - manifold-backed solid to convert
 * @param {string} name - object name written into the 3MF
 * @returns {WeldedMesh} welded mesh
 */
const geom3ToWeldedMesh = (solid: Geom3, name: string): WeldedMesh => {
  const polygons = toPolygons(solid);
  const vertexIndexByKey = new Map<string, number>();
  const vertices: number[] = [];
  const triangles: number[] = [];

  const roundCoord = (value: number) => Math.round(value * WELD_PRECISION) / WELD_PRECISION;
  const getVertexIndex = (point: Vec3): number => {
    const key = `${roundCoord(point[0])},${roundCoord(point[1])},${roundCoord(point[2])}`;
    let index = vertexIndexByKey.get(key);
    if (index === undefined) {
      index = vertices.length / 3;
      vertexIndexByKey.set(key, index);
      vertices.push(point[0], point[1], point[2]);
    }
    return index;
  };

  for (const polygon of polygons) {
    const points = polygon.vertices;
    for (let i = 1; i < points.length - 1; i++) {
      const a = getVertexIndex(points[0]);
      const b = getVertexIndex(points[i]);
      const c = getVertexIndex(points[i + 1]);
      if (a !== b && b !== c && a !== c) triangles.push(a, b, c);
    }
  }

  return { name, vertices, triangles };
};

const formatCoord = (value: number): string => {
  const rounded = Math.round(value * 1e6) / 1e6;
  return String(rounded);
};

/**
 * Builds a 3MF model XML document from welded meshes.
 * Box and Lid are mesh objects referenced by a single assembly object (components)
 * so slicers treat them as one grouped multi-part object.
 *
 * @param {WeldedMesh[]} meshes - named meshes to include
 * @param {string} assemblyName - name for the assembly group (export filename without extension)
 * @param {string} shareUrl - share link stored as ShareURL metadata
 * @param {string} formStateJson - JSON form backup stored as FormState metadata
 * @returns {{ xml: string, assemblyId: number }} model XML and assembly object id
 */
const build3mfModelXml = (
  meshes: WeldedMesh[],
  assemblyName: string,
  shareUrl: string,
  formStateJson: string
): { xml: string; assemblyId: number } => {
  const materials = meshes
    .map((_, i) => `      <base name="mat${i}" displaycolor="#FFA000FF"/>`)
    .join('\n');

  const meshObjects = meshes
    .map((mesh, i) => {
      const objectId = i + 1;
      const vertexXml = Array.from({ length: mesh.vertices.length / 3 }, (_, vi) => {
        const x = formatCoord(mesh.vertices[vi * 3]);
        const y = formatCoord(mesh.vertices[vi * 3 + 1]);
        const z = formatCoord(mesh.vertices[vi * 3 + 2]);
        return `          <vertex x="${x}" y="${y}" z="${z}"/>`;
      }).join('\n');

      const triangleXml = Array.from({ length: mesh.triangles.length / 3 }, (_, ti) => {
        const v1 = mesh.triangles[ti * 3];
        const v2 = mesh.triangles[ti * 3 + 1];
        const v3 = mesh.triangles[ti * 3 + 2];
        return `          <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`;
      }).join('\n');

      return `    <object id="${objectId}" type="model" pid="0" pindex="${i}" name="${escapeXml(mesh.name)}">
      <mesh>
        <vertices>
${vertexXml}
        </vertices>
        <triangles>
${triangleXml}
        </triangles>
      </mesh>
    </object>`;
    })
    .join('\n');

  const assemblyId = meshes.length + 1;
  const componentXml = meshes.map((_, i) => `      <component objectid="${i + 1}"/>`).join('\n');
  const assemblyObject = `    <object id="${assemblyId}" type="model" name="${escapeXml(assemblyName)}">
      <components>
${componentXml}
      </components>
    </object>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="und" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Application">BoxBuilder</metadata>
  <metadata name="CreationDate">${new Date().toISOString()}</metadata>
  <metadata name="app-name">boxbuilder</metadata>
  <metadata name="ShareURL">${escapeXml(shareUrl)}</metadata>
  <metadata name="FormState">${escapeXml(formStateJson)}</metadata>
  <resources>
    <basematerials id="0">
${materials}
    </basematerials>
${meshObjects}
${assemblyObject}
  </resources>
  <build>
    <item objectid="${assemblyId}"/>
  </build>
</model>
`;

  return { xml, assemblyId };
};

/**
 * Builds Bambu Studio / Orca-style model_settings.config so part names inside an
 * assembly stay "Box" / "Lid" instead of falling back to "{group}" / "{group}_2".
 *
 * @param {WeldedMesh[]} meshes - named mesh parts (ids are 1-based in order)
 * @param {number} assemblyId - id of the components assembly object
 * @param {string} assemblyName - assembly display name
 * @returns {string} model_settings.config XML
 */
const buildModelSettingsConfig = (meshes: WeldedMesh[], assemblyId: number, assemblyName: string): string => {
  const parts = meshes
    .map(
      (mesh, i) => `    <part id="${i + 1}" subtype="normal_part">
      <metadata key="name" value="${escapeXml(mesh.name)}"/>
    </part>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="${assemblyId}">
    <metadata key="name" value="${escapeXml(assemblyName)}"/>
${parts}
  </object>
</config>
`;
};

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
  <Default Extension="config" ContentType="application/octet-stream"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

/** Strips a trailing file extension from an export name, if present. */
const stripFileExtension = (name: string): string => name.replace(/\.[^.\/]+$/, '');

export const export3MF = async (form: FormObject, name: string = 'box') => {
  const DEBUG_TIMER = GET_DEBUG_TIMER('formToSolids - export3MF');

  await useManifoldBackend();
  let solids: Geom3[];
  try {
    solids = formToSolids(form, false) as Geom3[];
  } finally {
    useJscadBackend();
  }
  DEBUG_TIMER.stop();

  const assemblyName = stripFileExtension(name) || 'box';
  const meshes = solids.map((solid, index) => geom3ToWeldedMesh(solid, OBJECT_NAMES[index] ?? `Part ${index}`));
  const shareUrl = buildShareUrl(form);
  const formStateJson = JSON.stringify(formToEffectiveExport(form));
  const { xml, assemblyId } = build3mfModelXml(meshes, assemblyName, shareUrl, formStateJson);
  const modelSettings = buildModelSettingsConfig(meshes, assemblyId, assemblyName);

  const packaged = zipSync(
    {
      '3D': { '3dmodel.model': strToU8(xml) },
      Metadata: { 'model_settings.config': strToU8(modelSettings) },
      _rels: { '.rels': strToU8(RELS) },
      '[Content_Types].xml': strToU8(CONTENT_TYPES)
    },
    { comment: 'created by BoxBuilder' }
  );

  const blob = new Blob([packaged], { type: 'model/3mf' });
  forceDownloadBlob(ensureFileExtension(name, '3mf'), blob);
};
