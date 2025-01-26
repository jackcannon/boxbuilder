import z from 'zod';

export const FormSchema = z.object({
  width: z.number().min(0.01),
  height: z.number().min(0.01),
  depth: z.number().min(0.01),
  isOuterDimensions: z.boolean(),
  wallThickness: z.number().min(0.01),
  lidThickness: z.number().min(0.01),
  lidDepth: z.number().min(0.01),
  lidTolerance: z.number().min(0.01),
  spacing: z.number().min(0.01),
  fileName: z.string().min(1)
});

export type FormSchemaType = typeof FormSchema;
export type FormObject = z.infer<FormSchemaType>;

export type FormInputType = 'slider' | 'number' | 'text' | 'checkbox';
export interface FormInputConfig {
  paramName: string; // key in the query string
  type: FormInputType;
  displayName: string;
  description: string;
  defaultValue: any;
  unit?: string;
  sliderStep?: number; // slider step/increment value
  inputStep?: number; // slider step/increment value
  min?: number; // where the slider limits are
  max?: number; // where the slider limits are
  trueLabel?: string; // for checkboxes
  falseLabel?: string; // for checkboxes
}

export const formConfig: { [K in keyof FormObject]: FormInputConfig } = {
  width: {
    paramName: 'w',
    type: 'slider',
    displayName: 'Width',
    description: 'Width of the box',
    defaultValue: 40,
    unit: 'mm',
    sliderStep: 1,
    inputStep: 0.25,
    max: 100
  },
  height: {
    paramName: 'h',
    type: 'slider',
    displayName: 'Height',
    description: 'Height of the box',
    defaultValue: 25,
    unit: 'mm',
    sliderStep: 1,
    inputStep: 0.25,
    max: 100
  },
  depth: {
    paramName: 'd',
    type: 'slider',
    displayName: 'Depth',
    description: 'Depth of the box',
    defaultValue: 40,
    unit: 'mm',
    sliderStep: 1,
    inputStep: 0.25,
    max: 100
  },
  isOuterDimensions: {
    paramName: 'is_outer',
    type: 'checkbox',
    displayName: 'Inner/Outer Dimensions',
    description: 'Are the width/height/depth the dimensions of the inside or the outside of the box?',
    defaultValue: false,
    falseLabel: 'Inner',
    trueLabel: 'Outer'
  },
  wallThickness: {
    paramName: 'wl_th',
    type: 'slider',
    displayName: 'Wall Thickness',
    description: 'Thickness of the box walls',
    defaultValue: 2,
    unit: 'mm',
    sliderStep: 0.2,
    max: 5
  },
  lidThickness: {
    paramName: 'ld_th',
    type: 'slider',
    displayName: 'Lid Thickness',
    description: 'Thickness of the box lid',
    defaultValue: 2,
    unit: 'mm',
    sliderStep: 0.2,
    max: 5
  },
  lidDepth: {
    paramName: 'ld_d',
    type: 'slider',
    displayName: 'Lid Depth',
    description: 'How deep the lid goes into the box',
    defaultValue: 2,
    unit: 'mm',
    sliderStep: 0.2,
    max: 10
  },
  lidTolerance: {
    paramName: 'ld_tol',
    type: 'slider',
    displayName: 'Lid Tolerance',
    description: 'Tolerance between the lid and the box',
    defaultValue: 0.1,
    unit: 'mm',
    sliderStep: 0.01,
    max: 1
  },
  spacing: {
    paramName: 'sp',
    type: 'slider',
    displayName: 'Spacing',
    description: 'How much space between the parts',
    defaultValue: 3,
    unit: 'mm',
    sliderStep: 0.5,
    max: 10
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
