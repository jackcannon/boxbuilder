import {
  FormObject,
  FormPropName,
  FormSchema,
  formConfig,
  getDefaultFileName,
  isFieldActive
} from './schema';

export const isFieldIncludedInExport = (key: FormPropName, form: FormObject): boolean => isFieldActive(key, form);

export const formToEffectiveExport = (form: FormObject): Partial<FormObject> =>
  Object.fromEntries(
    (Object.keys(formConfig) as FormPropName[])
      .filter((key) => isFieldIncludedInExport(key, form))
      .map((key) => [key, form[key]])
  ) as Partial<FormObject>;

export const getExportDisplayFileName = (form: FormObject): string => form.fileName.trim() || getDefaultFileName(form);

export const applyExportToForm = (current: FormObject, effective: Partial<FormObject>): FormObject => {
  let result: FormObject = { ...current };

  for (const [key, value] of Object.entries(effective)) {
    const prop = key as FormPropName;
    if (!(prop in formConfig)) continue;
    if (!isFieldIncludedInExport(prop, result)) continue;

    result = { ...result, [prop]: value };
  }

  try {
    return FormSchema.parse(result);
  } catch {
    return result;
  }
};
