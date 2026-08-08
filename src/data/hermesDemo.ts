export type ProfileId =
  | 'default'
  | 'orchestrator'
  | 'product-manager'
  | 'technical-architect'
  | 'backend-engineer'
  | 'frontend-engineer'
  | 'qa-engineer'
  | 'security-engineer';

export type ProfileState = 'running' | 'stopped' | 'available';

export type HermesProfile = {
  id: ProfileId;
  title: string;
  state: ProfileState;
  model: string;
  capacityLabel: string;
  description: string;
};

export type KanbanColumnId = 'triage' | 'todo' | 'ready' | 'running' | 'blocked' | 'done';

export type HermesTask = {
  id: string;
  title: string;
  summary: string;
  column: KanbanColumnId;
  profile: ProfileId;
  priority: 'P0' | 'P1' | 'P2';
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  tone: 'info' | 'success' | 'warning';
};

export const WORKER_CAPACITY = {
  used: 0,
  total: 3,
};

export const GATEWAY_STATUS = {
  label: 'Standby',
  detail: 'Telegram command envelopes ready; backend responses are demo state.',
};

export const HERMES_PROFILES: HermesProfile[] = [
  {
    id: 'default',
    title: 'Default',
    state: 'available',
    model: 'gpt-5-codex',
    capacityLabel: 'Shared',
    description: 'General command routing and single-agent fallback.',
  },
  {
    id: 'orchestrator',
    title: 'Orchestrator',
    state: 'running',
    model: 'gpt-5-codex',
    capacityLabel: 'Primary',
    description: 'Breaks goals into worker tasks and tracks dependencies.',
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    state: 'stopped',
    model: 'gpt-5-mini',
    capacityLabel: 'On demand',
    description: 'Clarifies outcomes, scope, and acceptance criteria.',
  },
  {
    id: 'technical-architect',
    title: 'Technical Architect',
    state: 'available',
    model: 'gpt-5-codex',
    capacityLabel: 'Review',
    description: 'Plans system boundaries, contracts, and implementation paths.',
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer',
    state: 'running',
    model: 'gpt-5-codex',
    capacityLabel: 'Worker',
    description: 'Implements services, persistence, and integration code.',
  },
  {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    state: 'available',
    model: 'gpt-5-codex',
    capacityLabel: 'Worker',
    description: 'Builds client workflows, states, and accessible UI.',
  },
  {
    id: 'qa-engineer',
    title: 'QA Engineer',
    state: 'stopped',
    model: 'gpt-5-mini',
    capacityLabel: 'Validation',
    description: 'Turns requirements into checks, regression cases, and reports.',
  },
  {
    id: 'security-engineer',
    title: 'Security Engineer',
    state: 'available',
    model: 'gpt-5-codex',
    capacityLabel: 'Review',
    description: 'Inspects auth, secrets, data handling, and unsafe execution paths.',
  },
];

export const KANBAN_COLUMNS: Array<{ id: KanbanColumnId; title: string; empty: string }> = [
  { id: 'triage', title: 'Triage', empty: 'No intake waiting.' },
  { id: 'todo', title: 'Todo', empty: 'Backlog is clear.' },
  { id: 'ready', title: 'Ready', empty: 'No task is queued.' },
  { id: 'running', title: 'Running', empty: 'No worker is active.' },
  { id: 'blocked', title: 'Blocked', empty: 'No blockers logged.' },
  { id: 'done', title: 'Done', empty: 'Nothing completed in this demo snapshot.' },
];

export const DEMO_TASKS: HermesTask[] = [
  {
    id: 'HMS-101',
    title: 'Mini App shell audit',
    summary: 'Confirm Telegram theme, back button, and command envelope behavior.',
    column: 'triage',
    profile: 'technical-architect',
    priority: 'P1',
  },
  {
    id: 'HMS-124',
    title: 'Worker lifecycle contract',
    summary: 'Document start, stop, blocked, and done transitions for Hermes agents.',
    column: 'todo',
    profile: 'orchestrator',
    priority: 'P1',
  },
  {
    id: 'HMS-138',
    title: 'Profile routing rules',
    summary: 'Map incoming task types to product, architecture, engineering, QA, and security profiles.',
    column: 'ready',
    profile: 'product-manager',
    priority: 'P2',
  },
  {
    id: 'HMS-142',
    title: 'Command envelope smoke test',
    summary: 'Send detail and action commands from the Kanban board through Telegram.',
    column: 'running',
    profile: 'backend-engineer',
    priority: 'P0',
  },
  {
    id: 'HMS-155',
    title: 'Production ntfy topic policy',
    summary: 'Waiting on the final topic naming and retention policy.',
    column: 'blocked',
    profile: 'security-engineer',
    priority: 'P1',
  },
];

export const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    title: 'Gateway handshake prepared',
    detail: 'Hermes can receive Telegram WebApp sendData payloads.',
    tone: 'success',
  },
  {
    id: 'a2',
    title: 'Worker pool idle',
    detail: '0 of 3 parallel slots are occupied in demo state.',
    tone: 'info',
  },
  {
    id: 'a3',
    title: 'Blocked task detected',
    detail: 'HMS-155 is waiting on ntfy topic policy.',
    tone: 'warning',
  },
];

export function getTaskCounts(tasks = DEMO_TASKS) {
  return {
    active: tasks.filter((task) => task.column === 'ready' || task.column === 'running').length,
    blocked: tasks.filter((task) => task.column === 'blocked').length,
  };
}
