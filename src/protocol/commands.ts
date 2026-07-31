import { z } from 'zod';

export const HadesCommandTypeSchema = z.enum(['hello.ping']);

export type HadesCommandType = z.infer<typeof HadesCommandTypeSchema>;

export const HadesCommandSchema = z.object({
  v: z.literal(1),
  source: z.literal('hades'),
  commandId: z.string().uuid(),
  type: HadesCommandTypeSchema,
  createdAt: z.string().datetime(),
  payload: z.unknown(),
  ui: z
    .object({
      screen: z.string().optional(),
      label: z.string().optional(),
    })
    .optional(),
});

export interface HadesCommand<TPayload = unknown> {
  v: 1;
  source: 'hades';
  commandId: string;
  type: HadesCommandType;
  createdAt: string;
  payload: TPayload;
  ui?: {
    screen?: string;
    label?: string;
  };
}
