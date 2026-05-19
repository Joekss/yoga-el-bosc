import { useState } from 'react';
import type { ArtistSet, Festival, SetStatus } from '../types';
import { STATUS_COLORS } from '../types';
import { ensurePermission } from '../lib/notifications';

interface Props {
  festival: Festival;
  set: ArtistSet;
  onClose: () => void;
  onSave: (patch: Partial<ArtistSet>) => Promise<void>;
  onDelete: () => Promise<void>;
  onStatus: (status: SetStatus) => Promise<void>;
}

const HIGHLIGHT_PALETTE = [
  '#10b981',
  '#eab308',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
];

export default function SetEditor({ festival, set, onClose, onSave, onDelete, onStatus }: Props) {
  const [artist, setArtist] = useState(set.artist);
  const [stageId, setStageId] = useState(set.stageId);
  const [start, setStart] = useState(toLocal(set.start));
  const [end, setEnd] = useState(toLocal(set.end));
  const [notes, setNotes] = useState(set.notes || '');
  const [alarmMin, setAlarmMin] = useState<number | ''>(
    set.alarmMinutesBefore == null ? '' : set.alarmMinutesBefore,
  );
  const [highlight, setHighlight] = useState<string | undefined>(set.highlight);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-ink-900 border border-ink-700 rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-auto pb-safe">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Editar set</h3>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-100">✕</button>
        </div>

        <div className="space-y-3">
          <Field label="Artista">
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Escenario">
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="input"
            >
              {festival.stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio">
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="input" />
            </Field>
            <Field label="Fin">
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="input" />
            </Field>
          </div>

          <Field label="Estado">
            <div className="flex gap-2">
              {(['must', 'maybe', 'skip'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatus(set.status === st ? null : st)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                    set.status === st
                      ? 'border-transparent text-black'
                      : 'border-ink-700 text-ink-200 hover:border-ink-500'
                  }`}
                  style={set.status === st ? { background: STATUS_COLORS[st] } : undefined}
                >
                  {st === 'must' ? '★ Imprescindible' : st === 'maybe' ? '◐ Quizá' : '✕ Paso'}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Color de celda">
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setHighlight(undefined)}
                className={`w-8 h-8 rounded-full border-2 ${
                  highlight === undefined ? 'border-white' : 'border-ink-700'
                }`}
              >
                <span className="block w-full h-full rounded-full bg-ink-700" />
              </button>
              {HIGHLIGHT_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setHighlight(c)}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    highlight === c ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>

          <Field label="Alarma (min antes)">
            <div className="flex gap-2">
              {[null, 5, 10, 15, 30].map((m) => (
                <button
                  key={String(m)}
                  type="button"
                  onClick={async () => {
                    if (m != null) await ensurePermission();
                    setAlarmMin(m == null ? '' : m);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs border ${
                    (alarmMin === '' ? null : alarmMin) === m
                      ? 'bg-accent-500 border-accent-500 text-white'
                      : 'border-ink-700 text-ink-200'
                  }`}
                >
                  {m == null ? 'Off' : `${m}m`}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notas">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg border border-ink-700 text-ink-300 hover:text-red-400 hover:border-red-400"
          >
            Borrar
          </button>
          <button
            onClick={() =>
              onSave({
                artist: artist.trim(),
                stageId,
                start: new Date(start).toISOString(),
                end: new Date(end).toISOString(),
                notes: notes.trim() || undefined,
                alarmMinutesBefore: alarmMin === '' ? null : Number(alarmMin),
                highlight,
              })
            }
            className="flex-1 py-2 rounded-lg bg-accent-500 hover:bg-accent-400 text-white font-medium"
          >
            Guardar
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: #17171c;
          border: 1px solid #2e2e38;
          color: #ececef;
          border-radius: 0.6rem;
          padding: 0.55rem 0.7rem;
          font-size: 0.9rem;
        }
        .input:focus {
          outline: none;
          border-color: #fb7185;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-300 mb-1">{label}</span>
      {children}
    </label>
  );
}

function toLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
