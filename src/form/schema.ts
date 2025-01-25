import z from 'zod';

export const FormSchema = z.object({
  width: z.number().min(0.01),
  height: z.number().min(0.01),
  depth: z.number().min(0.01),
  wallThickness: z.number().min(0.01),
  lidThickness: z.number().min(0.01),
  lidTolerance: z.number().min(0.01),
  fileName: z.string().min(1)
});

export type FormSchemaType = typeof FormSchema;
export type FormObject = z.infer<FormSchemaType>;

export type FormInputType = 'slider' | 'number' | 'text';
export interface FormInputConfig {
  paramName: string; // key in the query string
  type: FormInputType;
  displayName: string;
  description: string;
  defaultValue: any;
  unit?: string;
  step?: number; // slider step/increment value
  min?: number; // where the slider limits are
  max?: number; // where the slider limits are
}

export const formConfig: { [K in keyof FormObject]: FormInputConfig } = {
  width: {
    paramName: 'w',
    type: 'slider',
    displayName: 'Width',
    description: 'Width of the box',
    defaultValue: 40,
    unit: 'mm',
    step: 0.5,
    max: 100
  },
  height: {
    paramName: 'h',
    type: 'slider',
    displayName: 'Height',
    description: 'Height of the box',
    defaultValue: 25,
    unit: 'mm',
    step: 0.5,
    max: 100
  },
  depth: {
    paramName: 'd',
    type: 'slider',
    displayName: 'Depth',
    description: 'Depth of the box',
    defaultValue: 40,
    unit: 'mm',
    step: 0.5,
    max: 100
  },
  wallThickness: {
    paramName: 'wl_th',
    type: 'slider',
    displayName: 'Wall Thickness',
    description: 'Thickness of the box walls',
    defaultValue: 2,
    unit: 'mm',
    step: 0.2,
    max: 5
  },
  lidThickness: {
    paramName: 'ld_th',
    type: 'slider',
    displayName: 'Lid Thickness',
    description: 'Thickness of the box lid',
    defaultValue: 2,
    unit: 'mm',
    step: 0.2,
    max: 5
  },
  lidTolerance: {
    paramName: 'ld_tol',
    type: 'slider',
    displayName: 'Lid Tolerance',
    description: 'Tolerance between the lid and the box',
    defaultValue: 0.1,
    unit: 'mm',
    step: 0.01,
    max: 1
  },
  fileName: {
    paramName: 'fn',
    type: 'text',
    displayName: 'File Name',
    description: 'Name of the file',
    defaultValue: 'box',
    unit: '.stl'
  }
};

export const defaultForm: FormObject = Object.fromEntries(Object.entries(formConfig).map(([key, value]) => [key, value.defaultValue])) as FormObject;
