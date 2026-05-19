import { useRef, useState } from 'react';
import { useStore } from '../store/store';
import { ensurePermission } from '../lib/notifications';

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const festivals = useStore((s) => s.festivals);
  const importBackup = useStore((s) => s.importBackup);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [permState, setPermState] = useState<NotificationPermission | 'unknown'>(
    'Notification' in window ? Notification.permission : 'unknown',
  );

  return (
    <div className="px-4 py-6 max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-semibold">Ajustes</h1>

      <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Claude API</h2>
        <p className="text-xs text-ink-300">
          Tu key se guarda en el dispositivo (IndexedDB) y se usa para extraer timetables desde fotos, PDFs o webs cuando activas “Usar Claude API”.
        </p>
        <input
          type="password"
          placeholder="sk-ant-..."
          value={settings.anthropicApiKey || ''}
          onChange={(e) => setSettings({ anthropicApiKey: e.target.value })}
          className="input"
        />
      </section>

      <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Alarmas</h2>
        <label className="flex items-center justify-between text-sm">
          <span>Aviso por defecto (min antes)</span>
          <input
            type="number"
            min={0}
            max={120}
            value={settings.defaultAlarmMinutes}
            onChange={(e) => setSettings({ defaultAlarmMinutes: Number(e.target.value) })}
            className="w-20 input"
          />
        </label>
        <button
          onClick={async () => {
            const p = await ensurePermission();
            setPermState(p);
          }}
          className="px-3 py-2 rounded-lg border border-ink-700 hover:border-ink-500 text-sm"
        >
          Pedir permiso de notificaciones (ahora: {permState})
        </button>
        <p className="text-xs text-ink-400">
          En Apple Watch / Wear OS recibirás las notificaciones a través del móvil emparejado mientras esta PWA esté instalada y mantengas el dispositivo despierto.
        </p>
      </section>

      <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Vista</h2>
        <label className="flex items-center justify-between text-sm">
          <span>Zoom de timetable</span>
          <input
            type="range"
            min={0.6}
            max={2.2}
            step={0.1}
            value={settings.zoom}
            onChange={(e) => setSettings({ zoom: Number(e.target.value) })}
          />
        </label>
      </section>

      <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Importar desde URL</h2>
        <p className="text-xs text-ink-300">
          Proxy CORS para descargar HTML de webs de festivales. Si el proxy por defecto falla, prueba otro (p. ej. <code className="text-ink-100">https://api.allorigins.win/raw?url=</code>) o deja vacío para desactivar.
        </p>
        <input
          value={settings.corsProxy}
          onChange={(e) => setSettings({ corsProxy: e.target.value })}
          placeholder="https://corsproxy.io/?"
          className="input"
        />
      </section>

      <section className="bg-ink-900 border border-ink-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Datos</h2>
        <p className="text-xs text-ink-300">
          {festivals.length} festival(es) guardados localmente. Todo vive en tu dispositivo.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify({ festivals, settings }, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `festival-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 rounded-lg border border-ink-700 text-sm"
          >
            Exportar backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 rounded-lg border border-ink-700 text-sm"
          >
            Importar backup…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                const text = await file.text();
                const data = JSON.parse(text);
                const replace = confirm(
                  'OK = reemplazar todo. Cancelar = combinar con lo existente (los festivales con el mismo id se sobrescriben).',
                );
                const res = await importBackup(data, replace ? 'replace' : 'merge');
                setImportMsg(`Importados ${res.imported} festival(es).`);
              } catch (err) {
                setImportMsg(`Error: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
          />
        </div>
        {importMsg && <p className="text-xs text-ink-300">{importMsg}</p>}
        <p className="text-[11px] text-ink-400">
          Copia el JSON exportado a otro dispositivo (AirDrop, Drive, etc.) e impórtalo allí: es la forma manual de sincronizar entre móviles.
        </p>
      </section>

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
