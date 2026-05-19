import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import FestivalView from './pages/FestivalView';
import Watch from './pages/Watch';
import Settings from './pages/Settings';
import { useStore } from './store/store';
import { scheduleAlarmsForFestival } from './lib/notifications';

export default function App() {
  const init = useStore((s) => s.init);
  const loaded = useStore((s) => s.loaded);
  const festivals = useStore((s) => s.festivals);
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!loaded) return;
    for (const f of festivals) scheduleAlarmsForFestival(f, settings.defaultAlarmMinutes);
  }, [loaded, festivals, settings.defaultAlarmMinutes]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-300">
        Cargando…
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="festival/:id" element={<FestivalView />} />
        <Route path="watch" element={<Watch />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
