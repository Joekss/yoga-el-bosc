import type { ArtistSet, Festival } from '../types';

type Timer = ReturnType<typeof setTimeout>;
const scheduled = new Map<string, Timer>();

export async function ensurePermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

function clear(key: string) {
  const t = scheduled.get(key);
  if (t) {
    clearTimeout(t);
    scheduled.delete(key);
  }
}

function fire(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    // Prefer service worker so notifications survive when tab is backgrounded
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: './icons/icon-192.svg',
          badge: './icons/icon-192.svg',
          tag: title,
        });
      });
    } else {
      new Notification(title, { body, icon: './icons/icon-192.svg' });
    }
  } catch {
    // ignore
  }
}

export function scheduleAlarmsForFestival(f: Festival, defaultMinutesBefore: number) {
  for (const s of f.sets) {
    if (s.alarmMinutesBefore == null && s.status !== 'must') {
      clear(s.id);
      continue;
    }
    const minutesBefore = s.alarmMinutesBefore ?? defaultMinutesBefore;
    scheduleAlarmForSet(f, s, minutesBefore);
  }
}

export function scheduleAlarmForSet(f: Festival, s: ArtistSet, minutesBefore: number) {
  clear(s.id);
  const fireAt = new Date(s.start).getTime() - minutesBefore * 60 * 1000;
  const delay = fireAt - Date.now();
  if (delay <= 0) return;
  // setTimeout max delay is ~24.8 days; we cap for safety
  if (delay > 2_000_000_000) return;
  const stage = f.stages.find((st) => st.id === s.stageId);
  const timer = setTimeout(() => {
    fire(`${s.artist} en ${minutesBefore} min`, `${stage?.name || ''} · ${formatTime(s.start)}`);
    scheduled.delete(s.id);
  }, delay);
  scheduled.set(s.id, timer);
}

export function cancelAllAlarms() {
  for (const t of scheduled.values()) clearTimeout(t);
  scheduled.clear();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
