import { useCallback, useState } from 'react';
import { AppShell } from './components/AppShell';
import { TelegramProvider } from './components/TelegramProvider';
import { AgentControlScreen } from './screens/AgentControlScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { DebugScreen } from './screens/DebugScreen';
import { HomeScreen } from './screens/HomeScreen';

type Screen = 'home' | 'dashboard' | 'agents' | 'debug';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const openDashboard = useCallback(() => setScreen('dashboard'), []);
  const openAgents = useCallback(() => setScreen('agents'), []);
  const openDebug = useCallback(() => setScreen('debug'), []);
  const openHome = useCallback(() => setScreen('home'), []);

  const currentScreen =
    screen === 'dashboard' ? (
      <DashboardScreen onBack={openHome} />
    ) : screen === 'agents' ? (
      <AgentControlScreen onBack={openHome} />
    ) : screen === 'debug' ? (
      <DebugScreen onBack={openHome} />
    ) : (
      <HomeScreen onOpenAgents={openAgents} onOpenDashboard={openDashboard} onOpenDebug={openDebug} />
    );

  return (
    <TelegramProvider>
      <AppShell>{currentScreen}</AppShell>
    </TelegramProvider>
  );
}
