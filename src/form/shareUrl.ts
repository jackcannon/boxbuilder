import { formConfig, FormObject, FormPropName } from './schema';
import { DimensionType } from './selectionTypes';

/** Previous param names. Add entries here when renaming share URL params */
const LEGACY_PARAM_ALIASES: Record<string, FormPropName> = {};

const buildParamNameDictionary = () => {
  const dict: Record<string, FormPropName> = { ...LEGACY_PARAM_ALIASES };

  for (const [key, config] of Object.entries(formConfig) as [FormPropName, (typeof formConfig)[FormPropName]][]) {
    dict[config.paramName] = key;
  }

  return dict;
};

const paramNameDictionary = buildParamNameDictionary();

export const isFieldActive = (key: FormPropName, form: FormObject): boolean => {
  const config = formConfig[key];
  return config.show ? config.show(form) : true;
};

export const isFieldIncludedInShare = (key: FormPropName, form: FormObject): boolean => isFieldActive(key, form);

export const queryToForm = (query: string, defaultValues: FormObject): FormObject => {
  const { data: dataParam, is_outer: isOuterParam, ...params } = Object.fromEntries(new URLSearchParams(query));

  let result: FormObject = { ...defaultValues };

  // Maintain support for legacy data param
  if (dataParam) {
    try {
      const data = JSON.parse(decodeURIComponent(dataParam));
      result = { ...result, ...data };
    } catch (e) {
      console.error('error parsing data param', e);
    }
  }

  // Old version of the app used is_outer param instead of dimensionType
  if (isOuterParam !== undefined) {
    result.dimensionType = Boolean(Number(isOuterParam)) ? DimensionType.OUTER : DimensionType.INNER;
  }

  for (const [paramName, value] of Object.entries(params)) {
    const key = paramNameDictionary[paramName];
    if (!key) continue;

    const config = formConfig[key];
    if (!isFieldActive(key, result)) continue;

    let parsedValue: unknown = value;
    if (['number', 'slider'].includes(config.type)) {
      parsedValue = parseFloat(value);
    }
    if (config.type === 'toggle_button') {
      const num = parseFloat(value);
      parsedValue = Number.isNaN(num) ? value : num;
    }
    if (['switch', 'boolean'].includes(config.type)) {
      parsedValue = Boolean(parseInt(value, 10));
    }

    result = {
      ...result,
      [key]: parsedValue
    } as FormObject;
  }

  return result;
};

export const formToQuery = (form: FormObject): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(form)) {
    const propName = key as FormPropName;
    if (!isFieldIncludedInShare(propName, form)) continue;

    const config = formConfig[propName];

    let valueStr = value.toString();
    if (['switch', 'boolean'].includes(config.type)) {
      valueStr = value ? '1' : '0';
    }

    params.set(config.paramName, valueStr);
  }

  return params.toString();
};

export const buildShareUrl = (form: FormObject): string => {
  const query = formToQuery(form);
  return `${window.location.origin}${window.location.pathname}?${query}`;
};

export const hasShareQuery = (search: string): boolean => {
  if (!search || search === '?') return false;

  for (const paramName of new URLSearchParams(search).keys()) {
    if (paramNameDictionary[paramName]) return true;
    if (paramName === 'data' || paramName === 'is_outer') return true;
  }

  return false;
};

export const hasResetQuery = (search: string): boolean => {
  if (!search || search === '?') return false;

  const value = new URLSearchParams(search).get('reset');
  return value === 'true' || value === '1';
};

export const stripQueryFromUrl = () => {
  window.history.replaceState(window.history.state, '', window.location.pathname);
};
