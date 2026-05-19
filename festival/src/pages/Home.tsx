import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import type { Festival } from '../types';
import { format } from 'date-fns';

function emptyFestival(): Festival {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  const id = crypto.randomUUID();
  return {
    id,
    name: 'Festival nuevo',
    startDate: iso,
    endDate: iso,
    stages: [],
    sets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function Home() {
  const { festivals, upsertFestival } = useStore();

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold">Tus festivales</h1>
        <button
          onClick={async () => {
            const f = emptyFestival();
            await upsertFestival(f);
            window.location.hash = `#/festival/${f.id}`;
          }}
          className="px-4 py-2 rounded-full bg-accent-500 hover:bg-accent-400 text-white text-sm font-medium"
        >
          + Nuevo
        </button>
      </div>

      {festivals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-700 p-8 text-center">
          <p className="text-ink-300 mb-3">Aún no hay festivales.</p>
          <p className="text-ink-400 text-sm">
            Crea uno y pega el lineup, importa una foto del flyer o un PDF de la web.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {festivals.map((f) => (
          <li key={f.id}>
            <Link
              to={`/festival/${f.id}`}
              className="block rounded-2xl border border-ink-800 bg-ink-900 hover:border-ink-600 px-4 py-3 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-ink-100">{f.name}</div>
                  <div className="text-xs text-ink-300">
                    {format(new Date(f.startDate), 'd MMM')} –{' '}
                    {format(new Date(f.endDate), 'd MMM yyyy')}
                    {f.location ? ` · ${f.location}` : ''}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {f.stages.slice(0, 5).map((s) => (
                    <span
                      key={s.id}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: s.color }}
                      title={s.name}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-ink-400 mt-1">
                {f.stages.length} escenarios · {f.sets.length} sets
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
