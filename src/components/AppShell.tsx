import { ReactNode } from 'react';
import { Columns3, Home, Settings, UsersRound, type LucideIcon } from 'lucide-react';
import { Header } from './Header';

export type AppScreen = 'home' | 'profiles' | 'kanban' | 'debug';

type AppShellProps = {
  activeScreen: AppScreen;
  children: ReactNode;
  onNavigate: (screen: AppScreen) => void;
};

const NAV_ITEMS: Array<{ screen: AppScreen; label: string; icon: LucideIcon }> = [
  { screen: 'home', label: 'Home', icon: Home },
  { screen: 'profiles', label: 'Profiles', icon: UsersRound },
  { screen: 'kanban', label: 'Kanban', icon: Columns3 },
  { screen: 'debug', label: 'Settings', icon: Settings },
];

export function AppShell({ activeScreen, children, onNavigate }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-tg-bg text-tg-text">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-tg-bg">
        <Header />
        <main className="flex flex-1 flex-col overflow-y-auto px-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-5">
          {children}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-tg-border bg-tg-bg/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <div className="grid grid-cols-4 gap-1" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.screen;

              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition active:scale-[0.98] ${
                    isActive ? 'bg-tg-secondary text-tg-link' : 'text-tg-hint hover:text-tg-text'
                  }`}
                  key={item.screen}
                  onClick={() => onNavigate(item.screen)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
