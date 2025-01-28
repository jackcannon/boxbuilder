import { NUM_SEGMENTS_MAX_EXPORT, TARGET_RESOLUTION_EXPORT, TARGET_RESOLUTION_PREVIEW } from '../constants';

export const limitRadius = (roundRadius: number, xSize: number, ySize: number): number => {
  let radius = roundRadius;
  if (radius <= 0) return 0;
  const minEdge = Math.min(xSize, ySize);
  const maxRadius = minEdge / 2 - 0.01;
  if (radius >= maxRadius) radius = maxRadius;
  return radius;
};

export const boolToDir = (bool: boolean): number => Number(bool) * 2 - 1;

export const calculateSegments = (isPreview: boolean = false, radius: number): number => {
  const resolution = isPreview ? TARGET_RESOLUTION_PREVIEW : TARGET_RESOLUTION_EXPORT;

  const normalisedRadius = Math.max(0, Number(radius) || 0);
  const normalisedResolution = Math.max(0, Number(resolution) || 0);

  if (normalisedResolution === 0) return NUM_SEGMENTS_MAX_EXPORT;

  const circumference: number = 2 * Math.PI * normalisedRadius;
  const minSegments: number = Math.ceil(circumference / normalisedResolution);

  let result = Math.max(8, Math.min(minSegments, NUM_SEGMENTS_MAX_EXPORT));
  result = Math.ceil(result / 4) * 4; // round up to nearest 4
  return result;
};
