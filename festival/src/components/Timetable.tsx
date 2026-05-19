import { useMemo, useState } from 'react';
import type { ArtistSet, Festival, SetStatus } from '../types';
import { STATUS_COLORS } from '../types';
import { useStore } from '../store/store';
import SetEditor from './SetEditor';

interface Props {
  festival: Festival;
  day: string; // YYYY-MM-DD
}

const HOUR_HEIGHT_BASE = 80; // px per hour at zoom 1

export default function Timetable({ festival, day }: Props) {
  const settings = useStore((s) => s.settings);
  const updateSet = useStore((s) => s.updateSet);
  const removeSet = useStore((s) => s.removeSet);
  const [editing, setEditing] = useState<ArtistSet | null>(null);

  const hourHeight = HOUR_HEIGHT_BASE * settings.zoom;

  const setsByStage = useMemo(() => {
    const dayStart = new Date(`${day}T00:00:00`);
    const dayEnd = new Date(`${day}T00:00:00`);
    dayEnd.setDate(dayEnd.getDate() + 1);
    dayEnd.setHours(8); // include early-morning sets bleeding into next day

    const byStage = new Map<string, ArtistSet[]>();
    for (const stage of festival.stages) byStage.set(stage.id, []);
    for (const s of festival.sets) {
      const start = new Date(s.start);
      if (start >= dayStart && start < dayEnd) {
        const arr = byStage.get(s.stageId) || [];
        arr.push(s);
        byStage.set(s.stageId, arr);
      }
    }
    for (const arr of byStage.values()) arr.sort((a, b) => a.start.localeCompare(b.start));
    return byStage;
  }, [festival, day]);

  const { earliestHour, latestHour } = useMemo(() => {
    let min = 12;
    let max = 26;
    for (const sets of setsByStage.values()) {
      for (const s of sets) {
        const start = new Date(s.start);
        const end = new Date(s.end);
        const base = new Date(`${day}T00:00:00`);
        const hStart = (start.getTime() - base.getTime()) / 3_600_000;
        const hEnd = (end.getTime() - base.getTime()) / 3_600_000;
        min = Math.min(min, Math.floor(hStart));
        max = Math.max(max, Math.ceil(hEnd));
      }
    }
    if (min === 12 && max === 26) return { earliestHour: 14, latestHour: 26 };
    return { earliestHour: Math.max(0, min - 1), latestHour: Math.max(max + 1, min + 4) };
  }, [setsByStage, day]);

  const totalHours = latestHour - earliestHour;
  const dayBase = new Date(`${day}T00:00:00`).getTime();
  const nowOffsetHrs = (Date.now() - dayBase) / 3_600_000;
  const showNowLine = nowOffsetHrs >= earliestHour && nowOffsetHrs <= latestHour;

  if (festival.stages.length === 0) {
    return (
      <div className="p-8 text-center text-ink-300">
        No hay escenarios. Importa un lineup o crea uno desde Ajustes del festival.
      </div>
    );
  }

  return (
    <>
      <div className="timetable-scroll overflow-auto border border-ink-800 rounded-2xl">
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${festival.stages.length}, minmax(160px, 1fr))` }}>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-ink-900 border-b border-ink-800" />
          {festival.stages.map((stage) => (
            <div
              key={stage.id}
              className="sticky top-0 z-10 bg-ink-900 border-b border-l border-ink-800 px-3 py-2 text-sm font-medium"
              style={{ color: stage.color }}
            >
              {stage.name}
            </div>
          ))}

          {/* Time column */}
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

          {/* Stage columns */}
          {festival.stages.map((stage) => {
            const sets = setsByStage.get(stage.id) || [];
            return (
              <div
                key={stage.id}
                className="relative border-l border-ink-800"
                style={{ height: totalHours * hourHeight }}
              >
                {/* Hour grid */}
                {Array.from({ length: totalHours }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-ink-800/60"
                    style={{ top: i * hourHeight }}
                  />
                ))}

                {/* Now line */}
                {showNowLine && (
                  <div
                    className="absolute left-0 right-0 now-line z-10"
                    style={{ top: (nowOffsetHrs - earliestHour) * hourHeight }}
                  />
                )}

                {/* Sets */}
                {sets.map((s) => {
                  const start = new Date(s.start).getTime();
                  const end = new Date(s.end).getTime();
                  const top = ((start - dayBase) / 3_600_000 - earliestHour) * hourHeight;
                  const height = Math.max(28, ((end - start) / 3_600_000) * hourHeight - 2);
                  const fill = s.highlight ?? (s.status ? STATUS_COLORS[s.status] : stage.color);
                  const opacity = s.status === 'skip' ? 0.4 : 1;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setEditing(s)}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left text-xs leading-tight overflow-hidden text-black/90 font-medium shadow-sm hover:ring-2 hover:ring-white/30 transition"
                      style={{
                        top,
                        height,
                        background: fill,
                        opacity,
                      }}
                    >
                      <div className="truncate">{s.artist}</div>
                      <div className="text-[10px] opacity-80 font-normal">
                        {formatRange(s.start, s.end)}
                      </div>
                      {s.alarmMinutesBefore != null && (
                        <span className="absolute top-1 right-1 text-[10px]">⏰</span>
                      )}
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
          onStatus={async (status: SetStatus) => {
            await updateSet(festival.id, editing.id, { status });
            setEditing({ ...editing, status });
          }}
        />
      )}
    </>
  );
}

function formatRange(startISO: string, endISO: string): string {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${fmt(s)}–${fmt(e)}`;
}
