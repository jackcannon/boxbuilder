import { ZodSchema } from 'zod';
import { useEffect, useState } from 'react';

export const startDoc = <T>(schema: ZodSchema, backup: object): T => {
  const startForm = schema.parse(backup);
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
  return startForm;
};

let debounceTimer: any;
const debounce = (callback: any, time: number) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(callback, time);
};
export const saveDoc = <T>(newForm: T) => {
  debounce(() => {
    let str = encodeURIComponent(JSON.stringify(newForm));
    window.history.pushState(newForm, 'form-state', '?data=' + str);
  }, 1000);
};

export const useHistoryDoc = <A>(schema: ZodSchema, defaultForm: any): [A, (a: A) => void] => {
  const [form, setForm] = useState<A>(() => startDoc<A>(schema, defaultForm));
  const doSetForm = (form: A) => {
    setForm(form);
    saveDoc<A>(form);
  };
  useEffect(() => {
    const historyChanged = (event: PopStateEvent) => {
      try {
        doSetForm(schema.parse(event.state));
      } catch (e) {
        console.log('error restoring from history');
      }
    };
    window.addEventListener('popstate', historyChanged);
    return () => {
      window.removeEventListener('popstate', historyChanged);
    };
  });
  return [form, doSetForm];
};
