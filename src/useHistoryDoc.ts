import { ZodSchema } from 'zod';
import { useEffect, useState } from 'react';
import { formConfig, FormObject, FormPropName } from './form/schema';
import { DimensionType } from './form/dimensionTypes';

const paramNameDictionary = Object.fromEntries(Object.entries(formConfig).map(([key, value]) => [value.paramName, key]));

const queryToObject = (query: string, defaultValues: FormObject): FormObject => {
  const { data: dataParam, is_outer: isOuterParam, ...params } = Object.fromEntries(new URLSearchParams(query));

  let result: FormObject = { ...defaultValues };

  // maintain support for legacy data param
  if (dataParam) {
    try {
      const data = JSON.parse(decodeURIComponent(dataParam));
      result = { ...result, ...data };
    } catch (e) {
      console.error('error parsing data param', e);
    }
  }

  // old version of the app used is_outer param instead of dimensionType
  if (isOuterParam !== undefined) {
    result.dimensionType = Boolean(Number(isOuterParam)) ? DimensionType.OUTER : DimensionType.INNER;
  }

  for (const [paramName, value] of Object.entries(params)) {
    const key = paramNameDictionary[paramName];
    if (!key) continue;

    const config = formConfig[key as FormPropName];
    if (!config) continue;

    let parsedValue: any = value;
    if (['number', 'slider', 'toggle_button'].includes(config.type)) {
      parsedValue = parseFloat(value);
    }
    if (['switch', 'boolean'].includes(config.type)) {
      parsedValue = Boolean(parseInt(value));
    }

    result = {
      ...result,
      [key]: parsedValue
    };
  }

  return result;
};
const objectToQuery = (obj: FormObject): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    const config = formConfig[key as FormPropName];

    let valueStr = value.toString();
    if (['switch', 'boolean'].includes(config.type)) {
      valueStr = value ? '1' : '0';
    }

    params.set(config.paramName, valueStr);
  }

  return params.toString();
};

const initialise = <T>(schema: ZodSchema, backup: object): T => {
  const startForm = schema.parse(backup);
  try {
    let query = window.location.search;
    const parsed = queryToObject(query, startForm);
    console.log('parsed', parsed);
    const data = schema.parse(parsed);
    return data;
  } catch (e) {
    console.log('error parsing query', e);
  }
  return startForm;
};

let debounceTimer: any;
const debounce = (callback: any, time: number) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(callback, time);
};
export const setQuery = <T>(newForm: FormObject) => {
  debounce(() => {
    const query = objectToQuery(newForm);
    window.history.pushState(newForm, '', '?' + query);
  }, 500);
};

export const useHistoryDoc = (schema: ZodSchema, defaultForm: any): [FormObject, (a: FormObject) => void] => {
  const [form, setForm] = useState<FormObject>(() => initialise<FormObject>(schema, defaultForm));
  const doSetForm = (form: FormObject) => {
    setForm(form);
    setQuery<FormObject>(form);
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
