import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import Timetable from '../components/Timetable';
import ImportDialog from '../components/ImportDialog';
import StagesEditor from '../components/StagesEditor';
import { ensurePermission, scheduleAlarmsForFestival } from '../lib/notifications';
import { format } from 'date-fns';

export default function FestivalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const festival = useStore((s) => s.festivals.find((f) => f.id === id));
  const settings = useStore((s) => s.settings);
  const upsertFestival = useStore((s) => s.upsertFestival);
  const removeFestival = useStore((s) => s.removeFestival);
  const addSet = useStore((s) => s.addSet);

  const [tab, setTab] = useState<'schedule' | 'settings'>('schedule');
  const [day, setDay] = useState(festival?.startDate || '');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (festival && !day) setDay(festival.startDate);
  }, [festival, day]);

  useEffect(() => {
    if (festival) scheduleAlarmsForFestival(festival, settings.defaultAlarmMinutes);
  }, [festival, settings.defaultAlarmMinutes]);

  const days = useMemo(() => {
    if (!festival) return [];
    const out: string[] = [];
    const start = new Date(`${festival.startDate}T00:00:00`);
    const end = new Date(`${festival.endDate}T00:00:00`);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }, [festival]);

  if (!festival) {
    return (
      <div className="p-8 text-center">
        <p className="mb-3 text-ink-300">Festival no encontrado.</p>
        <Link to="/" className="text-accent-400 underline">← Volver</Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-3 gap-2">
        <Link to="/" className="text-ink-300 hover:text-ink-100 text-sm">← Eventos</Link>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-1.5 rounded-full bg-accent-500 hover:bg-accent-400 text-white text-sm font-medium"
          >
            Importar
          </button>
          <button
            onClick={async () => {
              await ensurePermission();
              alert('Permisos solicitados. Las alarmas se programan automáticamente para los sets marcados como imprescindibles o con alarma manual.');
            }}
            className="px-3 py-1.5 rounded-full border border-ink-700 text-ink-200 text-sm"
          >
            Notificaciones
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-1">{festival.name}</h1>
      <p className="text-sm text-ink-300 mb-4">
        {format(new Date(festival.startDate), 'd MMM')} – {format(new Date(festival.endDate), 'd MMM yyyy')}
        {festival.location ? ` · ${festival.location}` : ''}
      </p>

      <div className="flex gap-1 text-sm mb-3">
        <Tab active={tab === 'schedule'} onClick={() => setTab('schedule')}>Horarios</Tab>
        <Tab active={tab === 'settings'} onClick={() => setTab('settings')}>Detalles</Tab>
      </div>

      {tab === 'schedule' && (
        <>
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap text-sm transition ${
                  day === d ? 'bg-ink-700 text-ink-100' : 'bg-ink-800 text-ink-300'
                }`}
              >
                {format(new Date(`${d}T00:00:00`), 'EEE d MMM')}
              </button>
            ))}
            <button
              onClick={async () => {
                const stage = festival.stages[0];
                if (!stage) return alert('Crea un escenario primero.');
                const start = new Date(`${day}T22:00:00`).toISOString();
                const end = new Date(`${day}T23:00:00`).toISOString();
                await addSet(festival.id, {
                  id: crypto.randomUUID(),
                  festivalId: festival.id,
                  stageId: stage.id,
                  artist: 'Nuevo set',
                  start,
                  end,
                  status: null,
                });
              }}
              className="ml-auto px-3 py-1.5 rounded-full border border-ink-700 text-sm whitespace-nowrap"
            >
              + Set
            </button>
          </div>
          {day && <Timetable festival={festival} day={day} />}
        </>
      )}

      {tab === 'settings' && (
        <div className="space-y-5">
          <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">Datos</h2>
            <Field label="Nombre">
              <input
                value={festival.name}
                onChange={(e) => upsertFestival({ ...festival, name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Ubicación">
              <input
                value={festival.location || ''}
                onChange={(e) => upsertFestival({ ...festival, location: e.target.value })}
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inicio">
                <input
                  type="date"
                  value={festival.startDate}
                  onChange={(e) => upsertFestival({ ...festival, startDate: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Fin">
                <input
                  type="date"
                  value={festival.endDate}
                  onChange={(e) => upsertFestival({ ...festival, endDate: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
          </section>

          <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4">
            <h2 className="font-semibold mb-3">Escenarios</h2>
            <StagesEditor festival={festival} />
          </section>

          <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4">
            <h2 className="font-semibold mb-3 text-red-300">Zona peligrosa</h2>
            <button
              onClick={async () => {
                if (confirm(`¿Borrar "${festival.name}"?`)) {
                  await removeFestival(festival.id);
                  navigate('/');
                }
              }}
              className="px-3 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm"
            >
              Borrar festival
            </button>
          </section>
        </div>
      )}

      {showImport && <ImportDialog festival={festival} onClose={() => setShowImport(false)} />}

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
        .input:focus { outline: none; border-color: #fb7185; }
      `}</style>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full ${active ? 'bg-ink-700 text-ink-100' : 'bg-ink-800 text-ink-300'}`}
    >
      {children}
    </button>
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
