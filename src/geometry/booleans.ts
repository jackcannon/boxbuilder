import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { intersect as jscadIntersect, subtract as jscadSubtract, union as jscadUnion } from '@jscad/modeling/src/operations/booleans';

import { getManifoldBooleanBackend, ManifoldBooleanBackend } from './manifoldBooleans';

/**
 * Boolean backend used by `subtract`/`union`/`intersect` below.
 * Defaults to JSCAD so preview renders never require the Manifold WASM module.
 * STL export switches to Manifold (via `useManifoldBackend`) so CSG on the
 * rounded-corner shells produces watertight, 0-open-edge meshes.
 */
let manifoldBackend: ManifoldBooleanBackend | null = null;

/**
 * Directly sets the active backend, bypassing the (Vite-only) Manifold WASM
 * loader. Exposed mainly so non-browser verification scripts can inject a
 * backend built from a Node/Bun-loaded WASM module and still exercise the
 * exact same fold/conversion logic that runs in the app.
 */
export const setActiveBooleanBackend = (backend: ManifoldBooleanBackend | null): void => {
  manifoldBackend = backend;
};

/** Loads (if needed) and activates the Manifold backend for subsequent boolean calls. */
export const useManifoldBackend = async (): Promise<void> => {
  setActiveBooleanBackend(await getManifoldBooleanBackend());
};

/** Reverts to the default JSCAD backend, e.g. once an export has finished. */
export const useJscadBackend = (): void => {
  setActiveBooleanBackend(null);
};

export const subtract = (...geometries: Geom3[]): Geom3 =>
  manifoldBackend ? manifoldBackend.subtract(...geometries) : jscadSubtract(...geometries);

export const union = (...geometries: Geom3[]): Geom3 => (manifoldBackend ? manifoldBackend.union(...geometries) : jscadUnion(...geometries));

export const intersect = (...geometries: Geom3[]): Geom3 =>
  manifoldBackend ? manifoldBackend.intersect(...geometries) : jscadIntersect(...geometries);
