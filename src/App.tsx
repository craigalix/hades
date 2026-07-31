import { useCallback, useState } from 'react';
import { AppShell } from './components/AppShell';
import { TelegramProvider } from './components/TelegramProvider';
import { DebugScreen } from './screens/DebugScreen';
import { HomeScreen } from './screens/HomeScreen';

type Screen = 'home' | 'debug';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const openDebug = useCallback(() => setScreen('debug'), []);
  const openHome = useCallback(() => setScreen('home'), []);

  return (
    <TelegramProvider>
      <AppShell>{screen === 'debug' ? <DebugScreen onBack={openHome} /> : <HomeScreen onOpenDebug={openDebug} />}</AppShell>
    </TelegramProvider>
  );
}
