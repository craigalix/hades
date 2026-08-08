import { Activity, Bug, CheckCircle2, Columns3, Loader2, RefreshCcw, ShieldCheck, UsersRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTelegram } from '../components/TelegramProvider';
import { GATEWAY_STATUS, RECENT_ACTIVITY, WORKER_CAPACITY, getTaskCounts } from '../data/hermesDemo';
import { closeTelegramMiniApp, setBackButtonVisible } from '../telegram/sdk';
import { sendHadesCommand } from '../telegram/sendCommand';

type HomeScreenProps = {
  onOpenKanban: () => void;
  onOpenProfiles: () => void;
  onOpenDebug: () => void;
};

export function HomeScreen({ onOpenKanban, onOpenProfiles, onOpenDebug }: HomeScreenProps) {
  const { snapshot } = useTelegram();
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const taskCounts = getTaskCounts();

  useEffect(() => setBackButtonVisible(false), []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function sendGatewayCheck() {
    setIsSending(true);
    setError(null);

    try {
      await sendHadesCommand({
        type: 'hermes.gateway.status',
        payload: {
          requestedAt: new Date().toISOString(),
          demo: true,
          telegram: {
            colorScheme: snapshot?.colorScheme ?? 'dark',
            isTelegram: snapshot?.isTelegram ?? false,
          },
        },
        ui: {
          screen: 'home',
          label: 'Hermes gateway status',
        },
      });
      setToast('Gateway check sent');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send command.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <section className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-tg-link">Demo state</p>
          <h2 className="text-3xl font-semibold tracking-[0] text-tg-text">Hermes control centre</h2>
          <p className="text-base leading-7 text-tg-hint">
            Mobile command surface for gateway health, profile routing, worker capacity, and task flow.
          </p>
        </div>

        <div className="rounded-lg border border-tg-border bg-tg-secondary p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
              <ShieldCheck aria-hidden="true" size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-tg-text">Gateway</h3>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  {GATEWAY_STATUS.label}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-tg-hint">{GATEWAY_STATUS.detail}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-tg-border bg-tg-secondary p-3">
            <p className="text-xs font-medium text-tg-hint">Workers</p>
            <p className="mt-2 text-2xl font-semibold text-tg-text">
              {WORKER_CAPACITY.used}/{WORKER_CAPACITY.total}
            </p>
            <p className="mt-1 text-xs text-tg-hint">Parallel capacity</p>
          </div>
          <div className="rounded-lg border border-tg-border bg-tg-secondary p-3">
            <p className="text-xs font-medium text-tg-hint">Active</p>
            <p className="mt-2 text-2xl font-semibold text-tg-text">{taskCounts.active}</p>
            <p className="mt-1 text-xs text-tg-hint">Ready/running</p>
          </div>
          <div className="rounded-lg border border-tg-border bg-tg-secondary p-3">
            <p className="text-xs font-medium text-tg-hint">Blocked</p>
            <p className="mt-2 text-2xl font-semibold text-tg-text">{taskCounts.blocked}</p>
            <p className="mt-1 text-xs text-tg-hint">Needs input</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-tg-button px-4 text-sm font-semibold text-tg-buttonText shadow-command transition active:scale-[0.99]"
            onClick={onOpenProfiles}
            type="button"
          >
            <UsersRound aria-hidden="true" size={18} />
            <span>Profiles</span>
          </button>

          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-secondary px-4 text-sm font-semibold text-tg-text transition active:scale-[0.99]"
            onClick={onOpenKanban}
            type="button"
          >
            <Columns3 aria-hidden="true" size={18} />
            <span>Kanban</span>
          </button>
        </div>
      </section>

      <section className="space-y-3" aria-label="Recent Hermes activity">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-tg-text">Recent Activity</h3>
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-secondary px-3 text-xs font-semibold text-tg-text transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSending}
            onClick={sendGatewayCheck}
            type="button"
          >
            {isSending ? <Loader2 aria-hidden="true" className="animate-spin" size={15} /> : <RefreshCcw aria-hidden="true" size={15} />}
            <span>{isSending ? 'Sending' : 'Check'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {RECENT_ACTIVITY.map((item) => (
            <article className="flex gap-3 rounded-lg border border-tg-border bg-tg-secondary p-3" key={item.id}>
              <span
                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  item.tone === 'success' ? 'bg-emerald-400' : item.tone === 'warning' ? 'bg-yellow-300' : 'bg-tg-link'
                }`}
              />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-tg-text">{item.title}</h4>
                <p className="mt-1 text-xs leading-5 text-tg-hint">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-secondary px-3 text-sm font-semibold text-tg-text transition active:scale-[0.99]"
          onClick={onOpenDebug}
          type="button"
        >
          <Bug aria-hidden="true" size={17} />
          <span>Settings/Debug</span>
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-tg-hint transition hover:text-tg-text active:scale-[0.99]"
          onClick={closeTelegramMiniApp}
          type="button"
        >
          <X aria-hidden="true" size={17} />
          <span>Close</span>
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
          {error}
        </div>
      ) : null}

      {toast ? (
        <div className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] mx-auto flex max-w-sm items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-surface px-4 py-3 text-sm font-semibold text-tg-text shadow-command">
          <CheckCircle2 aria-hidden="true" className="text-emerald-400" size={18} />
          <span>{toast}</span>
        </div>
      ) : null}

      {!snapshot?.isTelegram ? (
        <button
          className="fixed right-4 top-[calc(1rem+env(safe-area-inset-top))] grid h-10 w-10 place-items-center rounded-lg border border-tg-border bg-tg-surface text-tg-hint shadow-command"
          onClick={onOpenDebug}
          title="Debug"
          type="button"
        >
          <Activity aria-hidden="true" size={18} />
        </button>
      ) : null}
    </div>
  );
}
