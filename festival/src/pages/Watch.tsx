import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/store';
import type { ArtistSet, Festival } from '../types';

interface ItemView {
  set: ArtistSet;
  festival: Festival;
  stageName: string;
  stageColor: string;
}

export default function Watch() {
  const festivals = useStore((s) => s.festivals);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { current, upcoming } = useMemo(() => {
    const all: ItemView[] = [];
    for (const f of festivals) {
      for (const s of f.sets) {
        if (s.status === 'skip') continue;
        const stage = f.stages.find((st) => st.id === s.stageId);
        if (!stage) continue;
        all.push({ set: s, festival: f, stageName: stage.name, stageColor: stage.color });
      }
    }
    const current = all
      .filter((i) => new Date(i.set.start).getTime() <= now && new Date(i.set.end).getTime() > now)
      .sort(byMust);
    const upcoming = all
      .filter((i) => new Date(i.set.start).getTime() > now)
      .sort((a, b) => a.set.start.localeCompare(b.set.start))
      .slice(0, 8);
    return { current, upcoming };
  }, [festivals, now]);

  return (
    <div className="watch-compact px-4 py-5 max-w-md mx-auto">
      <h1 className="text-lg font-semibold mb-3">Ahora</h1>
      {current.length === 0 && <p className="text-ink-400 text-sm mb-4">Nada en curso.</p>}
      <ul className="space-y-2 mb-6">
        {current.map((i) => (
          <li key={i.set.id} className="rounded-xl p-3" style={{ background: i.stageColor }}>
            <div className="text-black font-semibold truncate">{i.set.artist}</div>
            <div className="text-black/70 text-xs">
              {i.stageName} · termina {fmt(i.set.end)}
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-3">Próximos</h2>
      <ul className="space-y-2">
        {upcoming.map((i) => {
          const isMust = i.set.status === 'must';
          const mins = Math.round((new Date(i.set.start).getTime() - now) / 60000);
          return (
            <li
              key={i.set.id}
              className="rounded-xl border border-ink-800 bg-ink-900 p-3 flex items-center gap-3"
            >
              <span className="w-2 h-10 rounded-full" style={{ background: i.stageColor }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center gap-1">
                  {isMust && <span className="text-emerald-400">★</span>}
                  {i.set.artist}
                </div>
                <div className="text-xs text-ink-400 truncate">
                  {i.stageName} · {i.festival.name}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{fmt(i.set.start)}</div>
                <div className="text-[10px] text-ink-400">en {humanizeMin(mins)}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function byMust(a: ItemView, b: ItemView): number {
  if (a.set.status === 'must' && b.set.status !== 'must') return -1;
  if (b.set.status === 'must' && a.set.status !== 'must') return 1;
  return a.set.start.localeCompare(b.set.start);
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function humanizeMin(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
