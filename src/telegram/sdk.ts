type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: unknown;
  colorScheme?: 'light' | 'dark';
  themeParams?: Record<string, string | undefined>;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  sendData?: (data: string) => void;
  BackButton?: {
    hide: () => void;
    show: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export type TelegramSnapshot = {
  initData: string;
  initDataUnsafe: unknown;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string | undefined>;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
  isTelegram: boolean;
};

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export async function initTelegramSdk(): Promise<TelegramSnapshot> {
  const [{ init }] = await Promise.all([import('@telegram-apps/sdk-react')]);

  try {
    init();
  } catch {
    // The SDK throws outside Telegram; the mock WebApp fallback keeps local dev usable.
  }

  const miniApp = getTelegramWebApp();
  miniApp?.ready?.();
  miniApp?.expand?.();
  miniApp?.BackButton?.hide();

  return getTelegramSnapshot();
}

export function getTelegramSnapshot(): TelegramSnapshot {
  const miniApp = getTelegramWebApp();

  return {
    initData: miniApp?.initData ?? '',
    initDataUnsafe: miniApp?.initDataUnsafe ?? null,
    colorScheme: miniApp?.colorScheme ?? 'dark',
    themeParams: miniApp?.themeParams ?? {},
    viewportHeight: miniApp?.viewportHeight,
    viewportStableHeight: miniApp?.viewportStableHeight,
    isExpanded: miniApp?.isExpanded,
    isTelegram: Boolean(miniApp),
  };
}

export function setBackButtonVisible(visible: boolean, onClick?: () => void): () => void {
  const backButton = getTelegramWebApp()?.BackButton;

  if (!backButton) {
    return () => undefined;
  }

  if (visible) {
    if (onClick) {
      backButton.onClick(onClick);
    }
    backButton.show();
  } else {
    backButton.hide();
  }

  return () => {
    if (onClick) {
      backButton.offClick(onClick);
    }
  };
}

export function closeTelegramMiniApp(): void {
  getTelegramWebApp()?.close?.();
}
