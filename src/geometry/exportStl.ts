// @ts-ignore
import * as serializer from '@jscad/stl-serializer';
import { Geometry } from '@jscad/modeling/src/geometries/types';

export const forceDownloadBlob = (title: string, blob: Blob) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = title;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const ensureFileExtension = (name: string, ext: string = 'stl') => {
  if (name.endsWith('.' + ext)) return name;
  return name + '.' + ext;
};

export const exportSTL = (solids: Geometry[], name: string = 'box') => {
  const rawData = serializer.serialize({ binary: true }, solids);
  const blob = new Blob(rawData, { type: 'model/stl' });
  forceDownloadBlob(ensureFileExtension(name, 'stl'), blob);
};
