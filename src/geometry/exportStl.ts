// @ts-ignore
import * as serializer from '@jscad/stl-serializer';

import { FormObject } from '../form/schema';
import { GET_DEBUG_TIMER } from '../utils';

import { useJscadBackend, useManifoldBackend } from './booleans';
import { formToSolids } from './formToSolids';

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

export const exportSTL = async (form: FormObject, name: string = 'box') => {
  const DEBUG_TIMER = GET_DEBUG_TIMER('formToSolids - exportSTL');

  await useManifoldBackend();
  let solids;
  try {
    solids = formToSolids(form, false);
  } finally {
    useJscadBackend();
  }
  DEBUG_TIMER.stop();

  const rawData = serializer.serialize({ binary: true }, solids);
  const blob = new Blob(rawData, { type: 'model/stl' });
  forceDownloadBlob(ensureFileExtension(name, 'stl'), blob);
};
