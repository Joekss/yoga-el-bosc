import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { ArtistSet, Festival } from '../types';
import { STATUS_COLORS } from '../types';
import { useStore } from '../store/store';
import SetEditor from './SetEditor';

interface Props {
  festival: Festival;
  /** YYYY-MM-DD list of days to render */
  days: string[];
}

const HOUR_HEIGHT_BASE = 60;

export default function WeekView({ festival, days }: Props) {
  const settings = useStore((s) => s.settings);
  const updateSet = useStore((s) => s.updateSet);
  const removeSet = useStore((s) => s.removeSet);
  const [editing, setEditing] = useState<ArtistSet | null>(null);

  const hourHeight = HOUR_HEIGHT_BASE * settings.zoom;

  const setsByDay = useMemo(() => {
    const map = new Map<string, ArtistSet[]>();
    for (const d of days) map.set(d, []);
    for (const s of festival.sets) {
      const start = new Date(s.start);
      // bucket by the day the set starts in
      const key = start.toISOString().slice(0, 10);
      const bucket = map.get(key);
      if (bucket) bucket.push(s);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [festival.sets, days]);

  const { earliestHour, latestHour } = useMemo(() => {
    let min = 14;
    let max = 26;
    for (const sets of setsByDay.values()) {
      for (const s of sets) {
        const start = new Date(s.start);
        const end = new Date(s.end);
        const base = new Date(`${start.toISOString().slice(0, 10)}T00:00:00`);
        const hStart = (start.getTime() - base.getTime()) / 3_600_000;
        const hEnd = (end.getTime() - base.getTime()) / 3_600_000;
        min = Math.min(min, Math.floor(hStart));
        max = Math.max(max, Math.ceil(hEnd));
      }
    }
    return { earliestHour: Math.max(0, min - 1), latestHour: Math.max(max + 1, min + 4) };
  }, [setsByDay]);

  const totalHours = latestHour - earliestHour;

  return (
    <>
      <div className="timetable-scroll overflow-auto border border-ink-800 rounded-2xl">
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, minmax(140px, 1fr))` }}>
          <div className="sticky top-0 z-10 bg-ink-900 border-b border-ink-800" />
          {days.map((d) => (
            <div
              key={d}
              className="sticky top-0 z-10 bg-ink-900 border-b border-l border-ink-800 px-3 py-2 text-sm font-medium text-ink-100"
            >
              {format(new Date(`${d}T00:00:00`), 'EEE d MMM')}
            </div>
          ))}

          <div className="relative" style={{ height: totalHours * hourHeight }}>
            {Array.from({ length: totalHours + 1 }, (_, i) => {
              const hour = (earliestHour + i) % 24;
              return (
                <div
                  key={i}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-400 font-mono"
                  style={{ top: i * hourHeight }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              );
            })}
          </div>

          {days.map((d) => {
            const sets = setsByDay.get(d) || [];
            const dayBase = new Date(`${d}T00:00:00`).getTime();
            const nowOffsetHrs = (Date.now() - dayBase) / 3_600_000;
            const showNowLine = nowOffsetHrs >= earliestHour && nowOffsetHrs <= latestHour;
            return (
              <div
                key={d}
                className="relative border-l border-ink-800"
                style={{ height: totalHours * hourHeight }}
              >
                {Array.from({ length: totalHours }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-ink-800/60"
                    style={{ top: i * hourHeight }}
                  />
                ))}

                {showNowLine && (
                  <div
                    className="absolute left-0 right-0 now-line z-10"
                    style={{ top: (nowOffsetHrs - earliestHour) * hourHeight }}
                  />
                )}

                {sets.map((s) => {
                  const stage = festival.stages.find((st) => st.id === s.stageId);
                  const start = new Date(s.start).getTime();
                  const end = new Date(s.end).getTime();
                  const top = ((start - dayBase) / 3_600_000 - earliestHour) * hourHeight;
                  const height = Math.max(22, ((end - start) / 3_600_000) * hourHeight - 2);
                  const fill = s.highlight ?? (s.status ? STATUS_COLORS[s.status] : stage?.color || '#3a3a46');
                  const opacity = s.status === 'skip' ? 0.4 : 1;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setEditing(s)}
                      className="absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight overflow-hidden text-black/90 font-medium shadow-sm hover:ring-2 hover:ring-white/30 transition"
                      style={{ top, height, background: fill, opacity }}
                      title={`${s.artist} · ${stage?.name || ''}`}
                    >
                      <div className="truncate">{s.artist}</div>
                      <div className="text-[9px] opacity-80 truncate">{stage?.name}</div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <SetEditor
          festival={festival}
          set={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await updateSet(festival.id, editing.id, patch);
            setEditing(null);
          }}
          onDelete={async () => {
            await removeSet(festival.id, editing.id);
            setEditing(null);
          }}
          onStatus={async (status) => {
            await updateSet(festival.id, editing.id, { status });
            setEditing({ ...editing, status });
          }}
        />
      )}
    </>
  );
}
