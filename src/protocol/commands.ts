import { z } from 'zod';

export const HadesCommandTypeSchema = z.enum([
  'hello.ping',
  'hermes.overview',
  'hermes.gateway.status',
  'profiles.status',
  'profiles.detail',
  'profiles.start',
  'profiles.stop',
  'kanban.status',
  'kanban.task.detail',
  'kanban.task.action',
  'agents.status',
  'agents.detail',
  'agents.context',
  'agents.logs',
  'agents.kill',
  'agents.create',
]);

export type HadesCommandType = z.infer<typeof HadesCommandTypeSchema>;

export const AgentIdPayloadSchema = z.object({
  id: z.string().min(1).max(120),
});

export const AgentLogsPayloadSchema = z.object({
  id: z.string().min(1).max(120),
  lines: z.number().int().min(20).max(200).optional(),
});

export const AgentKillPayloadSchema = z.object({
  id: z.string().min(1).max(120),
  confirm: z.literal(true),
});

export const AgentCreatePayloadSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.string().min(1).max(64),
  role: z.string().min(1).max(64),
  goal: z.string().min(1).max(500),
  personality: z.string().max(2000).optional(),
}) satisfies z.ZodType<AgentCreatePayload>;

export type AgentCreatePayload = {
  id: string;
  kind: string;
  role: string;
  goal: string;
  personality?: string;
};
export type AgentIdPayload = z.infer<typeof AgentIdPayloadSchema>;
export type AgentLogsPayload = z.infer<typeof AgentLogsPayloadSchema>;
export type AgentKillPayload = z.infer<typeof AgentKillPayloadSchema>;

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
