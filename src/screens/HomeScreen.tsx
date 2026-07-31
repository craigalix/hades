import { Bug, CheckCircle2, Info, Loader2, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTelegram } from '../components/TelegramProvider';
import { closeTelegramMiniApp, setBackButtonVisible } from '../telegram/sdk';
import { sendHadesCommand } from '../telegram/sendCommand';

type HomeScreenProps = {
  onOpenDebug: () => void;
};

export function HomeScreen({ onOpenDebug }: HomeScreenProps) {
  const { snapshot } = useTelegram();
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setBackButtonVisible(false), []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function sendHello() {
    setIsSending(true);
    setError(null);

    try {
      await sendHadesCommand({
        type: 'hello.ping',
        payload: {
          message: 'Hello from HADES',
          telegram: {
            colorScheme: snapshot?.colorScheme ?? 'dark',
            isTelegram: snapshot?.isTelegram ?? false,
          },
        },
        ui: {
          screen: 'home',
          label: 'Hello from HADES',
        },
      });
      setToast('Sent to Hermes');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send command.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <section className="flex flex-1 flex-col justify-center gap-6 py-8">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-tg-link">Phase 1</p>
          <h2 className="text-4xl font-semibold tracking-[0] text-tg-text">Hello from HADES</h2>
          <p className="max-w-sm text-base leading-7 text-tg-hint">Send a signed UI command envelope to Hermes through Telegram.</p>
        </div>

        <div className="space-y-3">
          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-tg-button px-4 text-sm font-semibold text-tg-buttonText shadow-command transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSending}
            onClick={sendHello}
            type="button"
          >
            {isSending ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <Send aria-hidden="true" size={18} />}
            <span>{isSending ? 'Sending' : 'Hello from HADES'}</span>
          </button>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-secondary px-4 text-sm font-semibold text-tg-text transition active:scale-[0.99]"
            onClick={onOpenDebug}
            type="button"
          >
            <Info aria-hidden="true" size={18} />
            <span>Open Telegram Info</span>
          </button>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-tg-hint transition hover:text-tg-text active:scale-[0.99]"
            onClick={closeTelegramMiniApp}
            type="button"
          >
            <X aria-hidden="true" size={18} />
            <span>Close</span>
          </button>
        </div>

        <p className="text-center text-sm text-tg-hint">Results will appear in Telegram chat.</p>

        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
            {error}
          </div>
        ) : null}
      </section>

      {toast ? (
        <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] mx-auto flex max-w-sm items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-surface px-4 py-3 text-sm font-semibold text-tg-text shadow-command">
          <CheckCircle2 aria-hidden="true" className="text-emerald-400" size={18} />
          <span>{toast} ✓</span>
        </div>
      ) : null}

      {!snapshot?.isTelegram ? (
        <button
          className="fixed right-4 top-[calc(1rem+env(safe-area-inset-top))] grid h-10 w-10 place-items-center rounded-lg border border-tg-border bg-tg-surface text-tg-hint shadow-command"
          onClick={onOpenDebug}
          title="Debug"
          type="button"
        >
          <Bug aria-hidden="true" size={18} />
        </button>
      ) : null}
    </div>
  );
}
