import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Cpu,
  FileText,
  Loader2,
  Radio,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  AgentIdPayloadSchema,
  AgentKillPayloadSchema,
  AgentLogsPayloadSchema,
  HadesCommandType,
} from '../protocol/commands';
import { sendHadesCommand } from '../telegram/sendCommand';
import { setBackButtonVisible } from '../telegram/sdk';

const AGENTS_SSE_URL = 'https://ntfy.sh/hades-agents-craig/sse';

const AgentStatusSchema = z.enum(['starting', 'running', 'idle', 'done', 'error', 'killed', 'lost']);

const AgentStateSchema = z.object({
  s: AgentStatusSchema,
  g: z.string(),
  k: z.string(),
  r: z.string(),
});

const AgentPayloadSchema = z.object({
  c: z.number().int().min(0),
  a: z.record(AgentStateSchema),
  t: z.string().datetime(),
  h: z.enum(['idle', 'busy']),
});

const NtfyMessageSchema = z.object({
  message: z.string(),
});

type AgentStatus = z.infer<typeof AgentStatusSchema>;
type AgentPayload = z.infer<typeof AgentPayloadSchema>;

type AgentControlScreenProps = {
  onBack: () => void;
};

type AgentAction = {
  type: HadesCommandType;
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
};

const agentActions: AgentAction[] = [
  { type: 'agents.detail', label: 'View Status', icon: Radio },
  { type: 'agents.context', label: 'View Context', icon: FileText },
  { type: 'agents.logs', label: 'View Logs', icon: ScrollText },
  { type: 'agents.kill', label: 'Kill Agent', icon: ShieldAlert, destructive: true },
];

const statusStyles: Record<AgentStatus, { label: string; dot: string; order: number }> = {
  running: { label: 'Running', dot: 'bg-emerald-400', order: 0 },
  starting: { label: 'Starting', dot: 'bg-amber-300', order: 1 },
  idle: { label: 'Idle', dot: 'bg-amber-300', order: 2 },
  error: { label: 'Error', dot: 'bg-red-400', order: 3 },
  done: { label: 'Done', dot: 'bg-zinc-300', order: 4 },
  killed: { label: 'Killed', dot: 'bg-zinc-300', order: 5 },
  lost: { label: 'Lost', dot: 'bg-zinc-700', order: 6 },
};

function parseAgentPayload(data: string): AgentPayload {
  const ntfyMessage = NtfyMessageSchema.parse(JSON.parse(data));
  return AgentPayloadSchema.parse(JSON.parse(ntfyMessage.message));
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'Waiting for update';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown update time';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatElapsed(value: string): string {
  const startedAt = new Date(value).getTime();
  if (Number.isNaN(startedAt)) {
    return '--';
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`;
  }

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function AgentControlScreen({ onBack }: AgentControlScreenProps) {
  const [payload, setPayload] = useState<AgentPayload | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'error'>('connecting');
  const [retryKey, setRetryKey] = useState(0);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [sendingType, setSendingType] = useState<HadesCommandType | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setNowTick] = useState(0);

  useEffect(() => setBackButtonVisible(true, onBack), [onBack]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    setConnectionStatus('connecting');
    setError(null);

    const source = new EventSource(AGENTS_SSE_URL);

    source.onopen = () => {
      setConnectionStatus('open');
      setError(null);
    };

    source.onerror = () => {
      setConnectionStatus('error');
    };

    source.onmessage = (event) => {
      try {
        setPayload(parseAgentPayload(event.data));
        setConnectionStatus('open');
        setError(null);
      } catch (parseError) {
        setError(parseError instanceof Error ? parseError.message : 'Unable to parse agent update.');
      }
    };

    return () => source.close();
  }, [retryKey]);

  const agents = useMemo(() => {
    return Object.entries(payload?.a ?? {})
      .map(([id, agent]) => ({ id, ...agent }))
      .sort((left, right) => {
        const statusDelta = statusStyles[left.s].order - statusStyles[right.s].order;
        return statusDelta === 0 ? left.id.localeCompare(right.id) : statusDelta;
      });
  }, [payload]);

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? null;
  const activeCount = payload?.c ?? agents.filter((agent) => !['done', 'killed', 'lost'].includes(agent.s)).length;
  const shouldShowEmpty = payload?.c === 0 || agents.length === 0;
  const lastUpdated = payload?.t ?? null;

  async function sendAgentCommand(action: AgentAction, agentId: string) {
    setSendingType(action.type);
    setError(null);

    try {
      const commandPayload =
        action.type === 'agents.kill'
          ? AgentKillPayloadSchema.parse({ id: agentId, confirm: true })
          : action.type === 'agents.logs'
            ? AgentLogsPayloadSchema.parse({ id: agentId })
          : AgentIdPayloadSchema.parse({ id: agentId });

      await sendHadesCommand({
        type: action.type,
        payload: commandPayload,
        ui: {
          screen: 'agents',
          label: action.label,
        },
      });
      setToast('Sent to Hermes');
      setSelectedAgentId(null);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send command.');
    } finally {
      setSendingType(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-tg-border bg-tg-secondary text-tg-text transition active:scale-[0.98]"
          onClick={onBack}
          title="Back"
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold tracking-[0] text-tg-text">Agent Control</h2>
            <span className="shrink-0 rounded-full border border-tg-border bg-tg-secondary px-2 py-0.5 text-xs font-semibold text-tg-link">
              {activeCount} Active
            </span>
          </div>
          <p className="truncate text-sm text-tg-hint">Last updated {formatTimestamp(lastUpdated)}</p>
        </div>
      </div>

      {connectionStatus === 'error' ? (
        <div className="flex items-center gap-3 rounded-lg border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <Radio aria-hidden="true" className="shrink-0" size={18} />
          <span className="min-w-0 flex-1">Connection lost - tap Refresh to retry</span>
          <button
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-amber-300/40 px-2 text-xs font-semibold transition active:scale-[0.98]"
            onClick={() => setRetryKey((key) => key + 1)}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={14} />
            <span>Refresh</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs font-medium text-tg-hint">
          <span
            className={`h-2 w-2 rounded-full ${connectionStatus === 'open' ? 'bg-emerald-400' : 'bg-amber-300'}`}
            aria-hidden="true"
          />
          <span>{connectionStatus === 'open' ? 'Live connection' : 'Connecting to agent stream'}</span>
        </div>
      )}

      <section className="flex flex-1 flex-col gap-3">
        {!payload && connectionStatus !== 'error' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
            <Loader2 aria-hidden="true" className="animate-spin text-tg-link" size={28} />
            <p className="text-sm font-semibold text-tg-text">Waiting for agent data...</p>
          </div>
        ) : shouldShowEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-lg border border-tg-border bg-tg-secondary text-tg-link">
              <Cpu aria-hidden="true" size={28} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-tg-text">No agents running</p>
              <p className="max-w-xs text-sm leading-6 text-tg-hint">Agents appear here when Codex tasks are dispatched from Hermes.</p>
            </div>
          </div>
        ) : (
          agents.map((agent) => {
            const status = statusStyles[agent.s];
            const agentName = agent.k === agent.r ? agent.r : `${agent.k}:${agent.r}`;

            return (
              <button
                className="rounded-lg border border-tg-border bg-tg-secondary p-4 text-left text-tg-text shadow-command transition active:scale-[0.99]"
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${status.dot}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{agentName}</p>
                        <p className="text-xs font-medium text-tg-hint">{status.label}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-tg-hint">
                        <Clock3 aria-hidden="true" size={13} />
                        {formatElapsed(lastUpdated ?? payload?.t ?? new Date().toISOString())}
                      </span>
                    </div>
                    <p className="truncate text-sm leading-6 text-tg-hint">{agent.g}</p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </section>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
          {error}
        </div>
      ) : null}

      <p className="mt-auto text-center text-sm text-tg-hint">Tap an agent for details. Results appear in Telegram chat.</p>

      {selectedAgent ? (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/55 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-20">
          <div className="w-full max-w-sm rounded-lg border border-tg-border bg-tg-surface p-4 shadow-command">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-tg-text">{selectedAgent.k}:{selectedAgent.r}</p>
                <p className="truncate text-xs text-tg-hint">{selectedAgent.g}</p>
              </div>
              <button
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-tg-border bg-tg-secondary text-tg-hint transition active:scale-[0.98]"
                disabled={sendingType !== null}
                onClick={() => setSelectedAgentId(null)}
                title="Close"
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {agentActions.map((action) => {
                const Icon = action.icon;
                const isSending = sendingType === action.type;

                return (
                  <button
                    className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
                      action.destructive
                        ? 'border-red-500/40 bg-red-500/10 text-red-200'
                        : 'border-tg-border bg-tg-secondary text-tg-text'
                    }`}
                    disabled={sendingType !== null}
                    key={action.type}
                    onClick={() => void sendAgentCommand(action, selectedAgent.id)}
                    type="button"
                  >
                    {isSending ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : <Icon aria-hidden="true" size={17} />}
                    <span>{isSending ? 'Sending' : action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-sm items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-surface px-4 py-3 text-sm font-semibold text-tg-text shadow-command">
          <CheckCircle2 aria-hidden="true" className="text-emerald-400" size={18} />
          <span>{toast} ✓</span>
        </div>
      ) : null}
    </div>
  );
}
