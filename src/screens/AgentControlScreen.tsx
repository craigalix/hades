import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileText,
  Loader2,
  Plus,
  Target,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AgentCreatePayload } from '../protocol/commands';
import { sendHadesCommand } from '../telegram/sendCommand';
import { setBackButtonVisible } from '../telegram/sdk';

type AgentControlScreenProps = {
  onBack: () => void;
};

type AgentSummary = {
  s: string; // status
  g: string; // goal (truncated)
  k: string; // kind
  r: string; // role
  p: string; // personality (truncated)
};

type NtfyPayload = {
  c: number;
  a: Record<string, AgentSummary>;
  t: string | null;
  h: string;
};

const NTFY_TOPIC = 'hades-agents-craig';

const STATUS_BADGE: Record<string, string> = {
  starting: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  running: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  idle: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  done: 'border-gray-500/40 bg-gray-500/10 text-gray-400',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
  killed: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
};

function AgentStatusBadge({ status }: { status: string }) {
  const classes = STATUS_BADGE[status] ?? 'border-gray-600 bg-gray-600/10 text-gray-400';
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

function AgentCard({ agent }: { agent: AgentSummary & { id: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-tg-border bg-tg-secondary p-4">
      <button
        className="flex w-full items-center gap-3 text-left"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-tg-border bg-tg-surface text-tg-link">
          <Bot size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-tg-text">{agent.id}</span>
            <AgentStatusBadge status={agent.s} />
          </div>
          <p className="truncate text-xs text-tg-hint">{agent.k} · {agent.r}</p>
        </div>
        {expanded ? <ChevronUp size={16} className="shrink-0 text-tg-hint" /> : <ChevronDown size={16} className="shrink-0 text-tg-hint" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-tg-border pt-3 text-xs leading-6 text-tg-hint">
          <div className="flex items-start gap-2">
            <Target size={14} className="mt-1 shrink-0" />
            <span className="text-tg-text">{agent.g || '—'}</span>
          </div>
          {agent.p && (
            <div className="flex items-start gap-2">
              <FileText size={14} className="mt-1 shrink-0" />
              <span className="text-tg-text whitespace-pre-wrap">{agent.p}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const EMPTY_CREATE: AgentCreatePayload = {
  id: '',
  kind: '',
  role: '',
  goal: '',
  personality: '',
};

export function AgentControlScreen({ onBack }: AgentControlScreenProps) {
  const [agents, setAgents] = useState<Array<AgentSummary & { id: string }>>([]);
  const [hermesStatus, setHermesStatus] = useState('idle');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AgentCreatePayload>({ ...EMPTY_CREATE });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => setBackButtonVisible(true, onBack), [onBack]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  // Fetch current agent state from ntfy
  useEffect(() => {
    let alive = true;

    async function fetchState() {
      try {
        const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}/raw?poll=1`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const text = await res.text();
        const lines = text.trim().split('\n');
        if (!lines.length) return;
        const last = JSON.parse(lines[lines.length - 1]) as NtfyPayload;
        if (!alive) return;
        setAgents(Object.entries(last.a ?? {}).map(([id, a]) => ({ id, ...a })));
        setHermesStatus(last.h ?? 'idle');
      } catch {
        // ntfy unavailable — show empty state
      } finally {
        if (alive) setLoadingAgents(false);
      }
    }

    void fetchState();
    return () => { alive = false; };
  }, []);

  function updateForm<K extends keyof AgentCreatePayload>(key: K, value: AgentCreatePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    if (!form.id || !form.kind || !form.role || !form.goal) {
      setError('ID, Kind, Role, and Goal are required.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendHadesCommand({
        type: 'agents.create',
        payload: form,
        ui: { screen: 'agents', label: `Create agent: ${form.id}` },
      });
      setToast('Agent create command sent');
      setShowForm(false);
      setForm({ ...EMPTY_CREATE });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send command.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Header */}
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
          <h2 className="text-base font-semibold tracking-[0] text-tg-text">Agent Control</h2>
          <p className="truncate text-sm text-tg-hint">
            Hermes: <span className={hermesStatus === 'busy' ? 'text-emerald-400' : 'text-tg-hint'}>{hermesStatus}</span>
          </p>
        </div>
        <button
          className="flex h-10 items-center gap-1.5 rounded-lg border border-tg-border bg-tg-surface px-3 text-sm font-semibold text-tg-link transition active:scale-[0.98] disabled:opacity-50"
          disabled={showForm}
          onClick={() => setShowForm(true)}
          type="button"
        >
          <Plus size={16} />
          New Agent
        </button>
      </div>

      {/* Create Agent Form */}
      {showForm && (
        <div className="rounded-lg border border-tg-border bg-tg-secondary p-4">
          <h3 className="mb-3 text-sm font-semibold text-tg-text flex items-center gap-2">
            <Bot size={16} className="text-tg-link" />
            New Agent
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-tg-hint">Agent ID *</label>
                <input
                  className="w-full rounded-lg border border-tg-border bg-tg-surface px-3 py-2 text-sm text-tg-text placeholder:text-tg-hint/50 outline-none focus:border-tg-link transition"
                  placeholder="e.g. my-coder-agent"
                  value={form.id}
                  onChange={(e) => updateForm('id', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-tg-hint">Kind *</label>
                <input
                  className="w-full rounded-lg border border-tg-border bg-tg-surface px-3 py-2 text-sm text-tg-text placeholder:text-tg-hint/50 outline-none focus:border-tg-link transition"
                  placeholder="e.g. codex"
                  value={form.kind}
                  onChange={(e) => updateForm('kind', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-tg-hint">Role *</label>
                <input
                  className="w-full rounded-lg border border-tg-border bg-tg-surface px-3 py-2 text-sm text-tg-text placeholder:text-tg-hint/50 outline-none focus:border-tg-link transition"
                  placeholder="e.g. engineer"
                  value={form.role}
                  onChange={(e) => updateForm('role', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-tg-hint">Goal *</label>
                <input
                  className="w-full rounded-lg border border-tg-border bg-tg-surface px-3 py-2 text-sm text-tg-text placeholder:text-tg-hint/50 outline-none focus:border-tg-link transition"
                  placeholder="e.g. Refactor auth module"
                  value={form.goal}
                  onChange={(e) => updateForm('goal', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-tg-hint">
                Personality
                <span className="ml-1 text-tg-hint/50">(how the agent should behave)</span>
              </label>
              <textarea
                className="w-full min-h-[80px] rounded-lg border border-tg-border bg-tg-surface px-3 py-2 text-sm text-tg-text placeholder:text-tg-hint/50 outline-none focus:border-tg-link transition resize-y"
                placeholder="e.g. You are a helpful coding assistant. Be concise and provide working code examples. Prefer Python and TypeScript."
                value={form.personality ?? ''}
                onChange={(e) => updateForm('personality', e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-button px-4 py-2.5 text-sm font-semibold text-tg-buttonText transition active:scale-[0.98] disabled:opacity-60"
                disabled={sending}
                onClick={() => void handleCreate()}
                type="button"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {sending ? 'Sending...' : 'Create Agent'}
              </button>
              <button
                className="rounded-lg border border-tg-border bg-tg-secondary px-4 py-2.5 text-sm font-medium text-tg-hint transition active:scale-[0.98]"
                onClick={() => { setShowForm(false); setError(null); }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
          {error}
        </div>
      ) : null}

      {/* Agent List */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-tg-hint">
          Active Agents
          <span className="ml-1.5 font-normal normal-case">({agents.length})</span>
        </h3>

        {loadingAgents ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-tg-hint">
            <Loader2 size={16} className="animate-spin" />
            Loading agents...
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Cpu size={32} className="text-tg-hint/40" />
            <p className="text-sm text-tg-hint">No agents registered.</p>
            <p className="text-xs text-tg-hint/60">Tap "New Agent" to create one.</p>
          </div>
        ) : (
          agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
        )}
      </section>

      {/* Toast */}
      {toast ? (
        <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] mx-auto flex max-w-sm items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-surface px-4 py-3 text-sm font-semibold text-tg-text shadow-command">
          <CheckCircle2 aria-hidden="true" className="text-emerald-400" size={18} />
          <span>{toast} ✓</span>
        </div>
      ) : null}
    </div>
  );
}