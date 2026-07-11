import { ZodSchema } from 'zod';
import { useEffect, useState } from 'react';

import { FormObject } from './form/schema';
import { hasShareQuery, queryToForm, stripQueryFromUrl } from './form/shareUrl';

interface InitialState {
  form: FormObject;
  stripQueryOnMount: boolean;
}

const initialise = (schema: ZodSchema, getDefaultForm: () => FormObject): InitialState => {
  const defaults = schema.parse(getDefaultForm()) as FormObject;

  if (hasShareQuery(window.location.search)) {
    try {
      const parsed = queryToForm(window.location.search, defaults);
      const form = schema.parse(parsed) as FormObject;
      return { form, stripQueryOnMount: true };
    } catch (e) {
      console.log('error parsing share query', e);
      return { form: defaults, stripQueryOnMount: false };
    }
  }

  return { form: defaults, stripQueryOnMount: false };
};

export const useHistoryDoc = (
  schema: ZodSchema,
  getDefaultForm: () => FormObject
): [FormObject, (form: FormObject) => void] => {
  const [initial] = useState(() => initialise(schema, getDefaultForm));
  const [form, setForm] = useState<FormObject>(initial.form);

  useEffect(() => {
    if (initial.stripQueryOnMount) stripQueryFromUrl();
  }, [initial.stripQueryOnMount]);

  return [form, setForm];
};
