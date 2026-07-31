import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { getTelegramSnapshot, initTelegramSdk, TelegramSnapshot } from '../telegram/sdk';
import { useTelegramTheme } from '../telegram/useTelegramTheme';

type TelegramContextValue = {
  snapshot: TelegramSnapshot | null;
  refresh: () => void;
  isReady: boolean;
  error: string | null;
};

const TelegramContext = createContext<TelegramContextValue | undefined>(undefined);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<TelegramSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    initTelegramSdk()
      .then((nextSnapshot) => {
        if (alive) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch((sdkError: unknown) => {
        if (alive) {
          setSnapshot(getTelegramSnapshot());
          setError(sdkError instanceof Error ? sdkError.message : 'Telegram SDK initialization failed.');
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  useTelegramTheme(snapshot);

  const value = useMemo<TelegramContextValue>(
    () => ({
      snapshot,
      refresh: () => setSnapshot(getTelegramSnapshot()),
      isReady: Boolean(snapshot),
      error,
    }),
    [error, snapshot],
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegram() {
  const context = useContext(TelegramContext);

  if (!context) {
    throw new Error('useTelegram must be used inside TelegramProvider.');
  }

  return context;
}
