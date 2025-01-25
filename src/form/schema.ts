import z from 'zod';

export const BoxSchema = z.object({
  width: z.number().min(1).int(),
  height: z.number().min(1).int(),
  depth: z.number().min(1).int(),
  wallThickness: z.number().min(0.1).max(5),
  lidThickness: z.number().min(0.1).max(5),
  lidTolerance: z.number().min(0.0).max(5),
  cornerRadius: z.number().min(1).max(5)
});

export type Box = z.infer<typeof BoxSchema>;

export const defaultBox = {
  width: 10,
  height: 10,
  depth: 10,
  wallThickness: 2,
  lidThickness: 2,
  lidTolerance: 2,
  cornerRadius: 2
};
