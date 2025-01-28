import z from 'zod';

export const FormSchema = z.object({
  width: z.number().min(0.01),
  height: z.number().min(0.01),
  depth: z.number().min(0.01),
  cornerRadius: z.number().min(0),
  isOuterDimensions: z.boolean(),
  wallThickness: z.number().min(0.01),
  lidThickness: z.number().min(0.01),
  lidDepth: z.number().min(0.01),
  lidCutout: z.boolean(),
  lidOverhang: z.number().min(0),
  lidTolerance: z.number().min(0.01),
  spacing: z.number().min(0.01),
  isPrintMode: z.boolean(),
  isCrossSectionMode: z.boolean(),
  fileName: z.string().min(1)
});

export type FormSchemaType = typeof FormSchema;
export type FormObject = z.infer<FormSchemaType>;

export type FormInputType = 'slider' | 'number' | 'text' | 'switch' | 'boolean';
export interface FormInputConfig {
  paramName: string; // key in the query string
  type: FormInputType;
  displayName: string;
  description: string;
  warning?: string; // warning message to display with the description
  defaultValue: any;
  unit?: string;
  sliderStep?: number; // slider step/increment value
  inputStep?: number; // slider step/increment value
  min?: number; // where the slider limits are
  max?: number; // where the slider limits are
  trueLabel?: string; // for switches
  falseLabel?: string; // for switches
}

export const formConfig: { [K in keyof FormObject]: FormInputConfig } = {
  width: {
    paramName: 'w',
    type: 'slider',
    displayName: 'Width',
    description: 'Width of the box',
    defaultValue: 25,
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
    defaultValue: 25,
    unit: 'mm',
    sliderStep: 1,
    inputStep: 0.25,
    max: 100
  },
  cornerRadius: {
    paramName: 'cr',
    type: 'slider',
    displayName: 'Corner Radius',
    description: 'Radius of the corners of the box',
    warning: 'Smooth curves are laggy to render, so the preview has simplified corners. Exported files will have smooth corners',
    defaultValue: 0,
    unit: 'mm',
    sliderStep: 0.1,
    min: 0,
    max: 10
  },
  isOuterDimensions: {
    paramName: 'is_outer',
    type: 'switch',
    displayName: 'Inner/Outer Dimensions',
    description: 'Are the width/height/depth the dimensions of the inside or the outside of the box?',
    defaultValue: true,
    falseLabel: 'Inner',
    trueLabel: 'Outer'
  },
  wallThickness: {
    paramName: 'wl_th',
    type: 'slider',
    displayName: 'Wall Thickness',
    description: 'Thickness of the box walls',
    defaultValue: 1.5,
    unit: 'mm',
    sliderStep: 0.1,
    max: 5
  },
  lidThickness: {
    paramName: 'ld_th',
    type: 'slider',
    displayName: 'Lid Thickness',
    description: 'Thickness of the box lid',
    defaultValue: 1.5,
    unit: 'mm',
    sliderStep: 0.1,
    max: 5
  },
  lidDepth: {
    paramName: 'ld_d',
    type: 'slider',
    displayName: 'Lid Depth',
    description: 'How deep the lid goes into the box',
    defaultValue: 5,
    unit: 'mm',
    sliderStep: 0.1,
    max: 10
  },
  lidCutout: {
    paramName: 'ld_co',
    type: 'boolean',
    displayName: 'Lid Cutout',
    description: 'Should the lid have a cutout instead of a solid top?',
    defaultValue: true
  },
  lidOverhang: {
    paramName: 'ld_oh',
    type: 'slider',
    displayName: 'Lid Overhang',
    description: 'How far should the lid protrude from the edge of the box',
    defaultValue: 0,
    unit: 'mm',
    sliderStep: 0.1,
    min: 0,
    max: 3
  },
  lidTolerance: {
    paramName: 'ld_tol',
    type: 'slider',
    displayName: 'Lid Tolerance',
    description: 'Tolerance between the lid and the box on each side',
    defaultValue: 0.06,
    unit: 'mm',
    sliderStep: 0.01,
    min: 0,
    max: 1
  },
  spacing: {
    paramName: 'sp',
    type: 'slider',
    displayName: 'Spacing',
    description: 'How much space between the parts. Only used in print in place mode',
    defaultValue: 5,
    unit: 'mm',
    sliderStep: 0.5,
    max: 10
  },
  isPrintMode: {
    paramName: 'md_p',
    type: 'boolean',
    displayName: 'Print Ready',
    description: 'Should the parts be oriented in a ready to print position?',
    defaultValue: true
  },
  isCrossSectionMode: {
    paramName: 'md_cs',
    type: 'boolean',
    displayName: 'Show Cross Section',
    description: 'Cut away a cross section of the model to see inside',
    defaultValue: false
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
