import { ReactNode } from 'react';
import { Header } from './Header';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-tg-bg text-tg-text">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-tg-bg">
        <Header />
        <main className="flex flex-1 flex-col px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">{children}</main>
      </div>
    </div>
  );
}
