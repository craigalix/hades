import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  Loader2,
  Sparkles,
  Sun,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { HadesCommandType } from '../protocol/commands';
import { sendHadesCommand } from '../telegram/sendCommand';
import { setBackButtonVisible } from '../telegram/sdk';

type DashboardScreenProps = {
  onBack: () => void;
};

type DashboardTile = {
  type: HadesCommandType;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

const dashboardTiles: DashboardTile[] = [
  {
    type: 'dashboard.brief',
    title: 'Brief me',
    subtitle: 'Daily priorities and context',
    icon: Sparkles,
  },
  {
    type: 'dashboard.weather',
    title: 'Weather',
    subtitle: 'Current forecast and alerts',
    icon: Sun,
  },
  {
    type: 'dashboard.tasks',
    title: 'My Tasks',
    subtitle: 'Open items and next actions',
    icon: ListChecks,
  },
  {
    type: 'dashboard.calendar',
    title: 'Calendar',
    subtitle: 'Upcoming meetings and blocks',
    icon: CalendarDays,
  },
  {
    type: 'dashboard.crypto',
    title: 'Crypto',
    subtitle: 'Market pulse and watchlist',
    icon: TrendingUp,
  },
];

export function DashboardScreen({ onBack }: DashboardScreenProps) {
  const [sendingType, setSendingType] = useState<HadesCommandType | null>(null);
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

  async function sendDashboardCommand(tile: DashboardTile) {
    setSendingType(tile.type);
    setError(null);

    try {
      await sendHadesCommand({
        type: tile.type,
        payload: {
          requestedAt: new Date().toISOString(),
        },
        ui: {
          screen: 'dashboard',
          label: tile.title,
        },
      });
      setToast('Sent to Hermes');
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
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-[0] text-tg-text">Dashboard</h2>
          <p className="truncate text-sm text-tg-hint">Command Center</p>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3">
        {dashboardTiles.map((tile) => {
          const Icon = tile.icon;
          const isSending = sendingType === tile.type;

          return (
            <button
              className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-secondary p-4 text-center text-tg-text transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={sendingType !== null}
              key={tile.type}
              onClick={() => void sendDashboardCommand(tile)}
              type="button"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg border border-tg-border bg-tg-surface text-tg-link">
                {isSending ? <Loader2 aria-hidden="true" className="animate-spin" size={21} /> : <Icon aria-hidden="true" size={21} />}
              </span>
              <span className="text-sm font-semibold">{isSending ? 'Sending' : tile.title}</span>
              <span className="max-w-[8.5rem] text-xs leading-5 text-tg-hint">{tile.subtitle}</span>
            </button>
          );
        })}
      </section>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
          {error}
        </div>
      ) : null}

      <p className="mt-auto text-center text-sm text-tg-hint">Results appear in Telegram chat.</p>

      {toast ? (
        <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] mx-auto flex max-w-sm items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-surface px-4 py-3 text-sm font-semibold text-tg-text shadow-command">
          <CheckCircle2 aria-hidden="true" className="text-emerald-400" size={18} />
          <span>{toast} ✓</span>
        </div>
      ) : null}
    </div>
  );
}
