import { ArrowLeft, CheckCircle2, CircleDashed, Loader2, MoveRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DEMO_TASKS, KANBAN_COLUMNS, type HermesTask } from '../data/hermesDemo';
import { sendHadesCommand } from '../telegram/sendCommand';
import { setBackButtonVisible } from '../telegram/sdk';

type KanbanScreenProps = {
  onBack: () => void;
};

const PRIORITY_CLASSES: Record<HermesTask['priority'], string> = {
  P0: 'border-red-500/40 bg-red-500/10 text-red-300',
  P1: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  P2: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
};

export function KanbanScreen({ onBack }: KanbanScreenProps) {
  const [sendingTask, setSendingTask] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setBackButtonVisible(true, onBack), [onBack]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function sendTaskCommand(task: HermesTask, action: 'detail' | 'advance') {
    const commandKey = `${task.id}:${action}`;

    setSendingTask(commandKey);
    setError(null);

    try {
      await sendHadesCommand({
        type: action === 'detail' ? 'kanban.task.detail' : 'kanban.task.action',
        payload: {
          taskId: task.id,
          action,
          fromColumn: task.column,
          profileId: task.profile,
          requestedAt: new Date().toISOString(),
        },
        ui: {
          screen: 'kanban',
          label: action === 'detail' ? `Inspect ${task.id}` : `Advance ${task.id}`,
        },
      });
      setToast('Command envelope sent');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send command.');
    } finally {
      setSendingTask(null);
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
          <h2 className="text-base font-semibold tracking-[0] text-tg-text">Kanban</h2>
          <p className="truncate text-sm text-tg-hint">Demo task lanes with command actions</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
          {error}
        </div>
      ) : null}

      <section className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2" aria-label="Hermes Kanban board">
        {KANBAN_COLUMNS.map((column) => {
          const tasks = DEMO_TASKS.filter((task) => task.column === column.id);

          return (
            <div className="w-[18rem] shrink-0 snap-start rounded-lg border border-tg-border bg-tg-secondary p-3" key={column.id}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-tg-text">{column.title}</h3>
                <span className="rounded-full border border-tg-border bg-tg-surface px-2 py-0.5 text-xs font-semibold text-tg-hint">
                  {tasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-tg-border bg-tg-surface/70 px-4 py-6 text-center">
                    <CircleDashed aria-hidden="true" className="text-tg-hint/70" size={22} />
                    <p className="text-sm text-tg-hint">{column.empty}</p>
                  </div>
                ) : (
                  tasks.map((task) => {
                    const detailKey = `${task.id}:detail`;
                    const advanceKey = `${task.id}:advance`;

                    return (
                      <article className="rounded-lg border border-tg-border bg-tg-surface p-3" key={task.id}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase text-tg-link">{task.id}</p>
                            <h4 className="mt-1 text-sm font-semibold leading-5 text-tg-text">{task.title}</h4>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_CLASSES[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-tg-hint">{task.summary}</p>
                        <p className="mt-3 truncate text-xs text-tg-text/80">{task.profile}</p>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-tg-border bg-tg-secondary px-2 text-xs font-semibold text-tg-text transition active:scale-[0.98] disabled:opacity-60"
                            disabled={sendingTask !== null}
                            onClick={() => void sendTaskCommand(task, 'detail')}
                            type="button"
                          >
                            {sendingTask === detailKey ? <Loader2 aria-hidden="true" className="animate-spin" size={14} /> : <Search aria-hidden="true" size={14} />}
                            Inspect
                          </button>
                          <button
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-tg-border bg-tg-button px-2 text-xs font-semibold text-tg-buttonText transition active:scale-[0.98] disabled:opacity-60"
                            disabled={sendingTask !== null}
                            onClick={() => void sendTaskCommand(task, 'advance')}
                            type="button"
                          >
                            {sendingTask === advanceKey ? <Loader2 aria-hidden="true" className="animate-spin" size={14} /> : <MoveRight aria-hidden="true" size={14} />}
                            Action
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </section>

      {toast ? (
        <div className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] mx-auto flex max-w-sm items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-surface px-4 py-3 text-sm font-semibold text-tg-text shadow-command">
          <CheckCircle2 aria-hidden="true" className="text-emerald-400" size={18} />
          <span>{toast}</span>
        </div>
      ) : null}
    </div>
  );
}
