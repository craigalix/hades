import { useEffect } from 'react';
import { TelegramSnapshot } from './sdk';

const FALLBACK_DARK = {
  bg_color: '#10131a',
  text_color: '#f5f7fb',
  hint_color: '#8a93a6',
  link_color: '#72c8ff',
  button_color: '#2f8cff',
  button_text_color: '#ffffff',
  secondary_bg_color: '#1a1f2b',
};

const FALLBACK_LIGHT = {
  bg_color: '#f5f7fb',
  text_color: '#111827',
  hint_color: '#6b7280',
  link_color: '#0b78d0',
  button_color: '#2385e8',
  button_text_color: '#ffffff',
  secondary_bg_color: '#ffffff',
};

function hexToRgbTriplet(hex: string): string {
  const normalized = hex.replace('#', '').trim();
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const numeric = Number.parseInt(value, 16);

  if (Number.isNaN(numeric) || value.length !== 6) {
    return '255 255 255';
  }

  return `${(numeric >> 16) & 255} ${(numeric >> 8) & 255} ${numeric & 255}`;
}

export function useTelegramTheme(snapshot: TelegramSnapshot | null): void {
  useEffect(() => {
    const root = document.documentElement;
    const isDark = snapshot?.colorScheme !== 'light';
    const fallback = isDark ? FALLBACK_DARK : FALLBACK_LIGHT;
    const theme = { ...fallback, ...(snapshot?.themeParams ?? {}) };

    root.dataset.theme = isDark ? 'dark' : 'light';
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.style.setProperty('--tg-color-bg', hexToRgbTriplet(theme.bg_color ?? fallback.bg_color));
    root.style.setProperty('--tg-color-text', hexToRgbTriplet(theme.text_color ?? fallback.text_color));
    root.style.setProperty('--tg-color-hint', hexToRgbTriplet(theme.hint_color ?? fallback.hint_color));
    root.style.setProperty('--tg-color-link', hexToRgbTriplet(theme.link_color ?? fallback.link_color));
    root.style.setProperty('--tg-color-button', hexToRgbTriplet(theme.button_color ?? fallback.button_color));
    root.style.setProperty('--tg-color-button-text', hexToRgbTriplet(theme.button_text_color ?? fallback.button_text_color));
    root.style.setProperty('--tg-color-secondary-bg', hexToRgbTriplet(theme.secondary_bg_color ?? fallback.secondary_bg_color));
    root.style.setProperty('--hades-surface', isDark ? '24 29 41' : '255 255 255');
    root.style.setProperty('--hades-border', isDark ? '54 63 82' : '218 224 235');
  }, [snapshot]);
}
