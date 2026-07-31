import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';
import { useTelegram } from '../components/TelegramProvider';
import { setBackButtonVisible } from '../telegram/sdk';

type DebugScreenProps = {
  onBack: () => void;
};

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-tg-text">{title}</h2>
      <pre className="max-h-52 overflow-auto rounded-lg border border-tg-border bg-tg-secondary p-3 text-xs leading-5 text-tg-hint">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

export function DebugScreen({ onBack }: DebugScreenProps) {
  const { error, isReady, refresh, snapshot } = useTelegram();

  useEffect(() => setBackButtonVisible(true, onBack), [onBack]);

  const viewport = {
    viewportHeight: snapshot?.viewportHeight ?? null,
    viewportStableHeight: snapshot?.viewportStableHeight ?? null,
    isExpanded: snapshot?.isExpanded ?? null,
    isReady,
    isTelegram: snapshot?.isTelegram ?? false,
    colorScheme: snapshot?.colorScheme ?? 'dark',
  };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-tg-border bg-tg-secondary text-tg-text"
          onClick={onBack}
          title="Back"
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </button>
        <h1 className="min-w-0 flex-1 text-center text-base font-semibold text-tg-text">Telegram Info</h1>
        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-tg-border bg-tg-secondary text-tg-text"
          onClick={refresh}
          title="Refresh"
          type="button"
        >
          <RefreshCcw aria-hidden="true" size={18} />
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm leading-6 text-yellow-100">
          {error}
        </div>
      ) : null}

      <JsonPanel title="Init Data" value={snapshot?.initData || '(empty)'} />
      <JsonPanel title="Theme Params" value={snapshot?.themeParams ?? {}} />
      <JsonPanel title="Viewport" value={viewport} />
      <JsonPanel title="Unsafe Init Data" value={snapshot?.initDataUnsafe ?? null} />
    </div>
  );
}
