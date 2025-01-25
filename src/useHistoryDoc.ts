import { ZodSchema } from 'zod';
import { useEffect, useState } from 'react';

export const startDoc = <T>(schema: ZodSchema, backup: object): T => {
  const startBox = schema.parse(backup);
  try {
    let q = window.location.search;
    if (q && q.startsWith('?data=')) {
      q = q.substring(6);
      let json = decodeURIComponent(q);
      let data = schema.parse(JSON.parse(json));
      console.log('got data from url', data);
      return data;
    }
  } catch (e) {
    console.log('error happened', e);
  }
  return startBox;
};

let debounceTimer: any;
const debounce = (callback: any, time: number) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(callback, time);
};
export const saveDoc = <T>(newBox: T) => {
  debounce(() => {
    let str = encodeURIComponent(JSON.stringify(newBox));
    window.history.pushState(newBox, 'box-state', '?data=' + str);
  }, 1000);
};

export const useHistoryDoc = <A>(schema: ZodSchema, defaultBox: any): [A, (a: A) => void] => {
  const [box, setBox] = useState<A>(() => startDoc<A>(schema, defaultBox));
  const doSetBox = (box: A) => {
    setBox(box);
    saveDoc<A>(box);
  };
  useEffect(() => {
    const historyChanged = (event: PopStateEvent) => {
      try {
        doSetBox(schema.parse(event.state));
      } catch (e) {
        console.log('error restoring from history');
      }
    };
    window.addEventListener('popstate', historyChanged);
    return () => {
      window.removeEventListener('popstate', historyChanged);
    };
  });
  return [box, doSetBox];
};
