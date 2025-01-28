import {
  NUM_SEGMENTS_MAX_EXPORT,
  NUM_SEGMENTS_MAX_PREVIEW,
  NUM_SEGMENTS_MIN,
  TARGET_RESOLUTION_EXPORT,
  TARGET_RESOLUTION_PREVIEW
} from '../constants';

export const limitRadius = (roundRadius: number, xSize: number, ySize: number): number => {
  let radius = roundRadius;
  if (radius <= 0) return 0;
  const minEdge = Math.min(xSize, ySize);
  const maxRadius = minEdge / 2 - 0.01;
  if (radius >= maxRadius) radius = maxRadius;
  return radius;
};

export const calculateSegments = (isPreview: boolean = false, radius: number): number => {
  const resolution = isPreview ? TARGET_RESOLUTION_PREVIEW : TARGET_RESOLUTION_EXPORT;
  const minLimit = NUM_SEGMENTS_MIN;
  const maxLimit = isPreview ? NUM_SEGMENTS_MAX_PREVIEW : NUM_SEGMENTS_MAX_EXPORT;

  const normalisedRadius = Math.max(0, Number(radius) || 0);
  const normalisedResolution = Math.max(0, Number(resolution) || 0);

  if (normalisedResolution === 0) return NUM_SEGMENTS_MAX_EXPORT;

  const circumference: number = 2 * Math.PI * normalisedRadius;
  const minSegments: number = Math.ceil(circumference / normalisedResolution);

  let result = Math.ceil(minSegments / 4) * 4; // round up to nearest 4
  result = Math.max(minLimit, Math.min(result, maxLimit));

  return result;
};
