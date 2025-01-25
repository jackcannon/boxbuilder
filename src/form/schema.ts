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

export const defaultForm = {
  width: 10,
  height: 10,
  depth: 10,
  wallThickness: 2,
  lidThickness: 2,
  lidTolerance: 2,
  cornerRadius: 2
};
