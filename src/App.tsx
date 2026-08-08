import { useCallback, useState } from 'react';
import { AppShell, type AppScreen } from './components/AppShell';
import { TelegramProvider } from './components/TelegramProvider';
import { DebugScreen } from './screens/DebugScreen';
import { HomeScreen } from './screens/HomeScreen';
import { KanbanScreen } from './screens/KanbanScreen';
import { ProfilesScreen } from './screens/ProfilesScreen';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const openKanban = useCallback(() => setScreen('kanban'), []);
  const openProfiles = useCallback(() => setScreen('profiles'), []);
  const openDebug = useCallback(() => setScreen('debug'), []);
  const openHome = useCallback(() => setScreen('home'), []);

  const currentScreen =
    screen === 'profiles' ? (
      <ProfilesScreen onBack={openHome} />
    ) : screen === 'kanban' ? (
      <KanbanScreen onBack={openHome} />
    ) : screen === 'debug' ? (
      <DebugScreen onBack={openHome} />
    ) : (
      <HomeScreen onOpenKanban={openKanban} onOpenProfiles={openProfiles} onOpenDebug={openDebug} />
    );

  return (
    <TelegramProvider>
      <AppShell activeScreen={screen} onNavigate={setScreen}>
        {currentScreen}
      </AppShell>
    </TelegramProvider>
  );
}
