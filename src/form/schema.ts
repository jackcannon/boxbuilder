import z from 'zod';

export const FormSchema = z.object({
  width: z.number().min(1).int(),
  height: z.number().min(1).int(),
  depth: z.number().min(1).int(),
  wallThickness: z.number().min(0.1).max(5),
  lidThickness: z.number().min(0.1).max(5),
  lidTolerance: z.number().min(0.0).max(5),
  cornerRadius: z.number().min(1).max(5)
});

export type FormSchemaType = typeof FormSchema;
export type FormObject = z.infer<FormSchemaType>;

export type FormInputType = 'slider' | 'number' | 'text';
export interface FormInputConfig {
  type: FormInputType;
  displayName: string;
  description: string;
  defaultValue: number;
  unit?: string;
}

export const formConfig: { [K in keyof FormObject]: FormInputConfig } = {
  width: {
    type: 'slider',
    displayName: 'Width',
    description: 'Width of the box',
    defaultValue: 40,
    unit: 'mm'
  },
  height: {
    type: 'slider',
    displayName: 'Height',
    description: 'Height of the box',
    defaultValue: 25,
    unit: 'mm'
  },
  depth: {
    type: 'slider',
    displayName: 'Depth',
    description: 'Depth of the box',
    defaultValue: 40,
    unit: 'mm'
  },
  wallThickness: {
    type: 'slider',
    displayName: 'Wall Thickness',
    description: 'Thickness of the box walls',
    defaultValue: 2,
    unit: 'mm'
  },
  lidThickness: {
    type: 'slider',
    displayName: 'Lid Thickness',
    description: 'Thickness of the box lid',
    defaultValue: 2,
    unit: 'mm'
  },
  lidTolerance: {
    type: 'slider',
    displayName: 'Lid Tolerance',
    description: 'Tolerance between the lid and the box',
    defaultValue: 0.1,
    unit: 'mm'
  },
  cornerRadius: {
    type: 'slider',
    displayName: 'Corner Radius',
    description: 'Radius of the box corners',
    defaultValue: 2,
    unit: 'mm'
  }
};

export const defaultForm: FormObject = Object.fromEntries(Object.entries(formConfig).map(([key, value]) => [key, value.defaultValue])) as FormObject;
