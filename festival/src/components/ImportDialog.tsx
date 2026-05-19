import { useState } from 'react';
import type { Festival } from '../types';
import { applyParsedToFestival, parseScheduleText, ParsedSchedule } from '../lib/parser';
import { extractScheduleWithClaude } from '../lib/claude';
import { fileToBase64, htmlToText } from '../lib/files';
import { pdfFileToText } from '../lib/pdf';
import { useStore } from '../store/store';

interface Props {
  festival: Festival;
  onClose: () => void;
}

type Tab = 'text' | 'image' | 'pdf' | 'html' | 'url';

export default function ImportDialog({ festival, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('text');
  const [text, setText] = useState('');
  const [baseDate, setBaseDate] = useState(festival.startDate);
  const [merge, setMerge] = useState(true);
  const [useClaude, setUseClaude] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedSchedule | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');

  const settings = useStore((s) => s.settings);
  const upsertFestival = useStore((s) => s.upsertFestival);

  async function fetchUrlViaProxy(target: string): Promise<string> {
    const proxy = settings.corsProxy || '';
    const finalUrl = proxy + encodeURIComponent(target);
    const res = await fetch(finalUrl);
    if (!res.ok) throw new Error(`Fetch ${res.status}: ${res.statusText}`);
    return await res.text();
  }

  const run = async () => {
    setError(null);
    setPreview(null);
    setLoading(true);
    try {
      let parsed: ParsedSchedule;
      if (tab === 'image') {
        if (!imageFile) throw new Error('Selecciona una imagen.');
        if (!settings.anthropicApiKey) throw new Error('Configura tu Anthropic API key en Ajustes.');
        const data = await fileToBase64(imageFile);
        parsed = await extractScheduleWithClaude(
          {
            apiKey: settings.anthropicApiKey,
            imageBase64: data,
            imageMimeType: (imageFile.type as 'image/png' | 'image/jpeg' | 'image/webp') || 'image/png',
          },
          baseDate,
        );
      } else if (tab === 'pdf') {
        if (!pdfFile) throw new Error('Selecciona un PDF.');
        if (useClaude) {
          if (!settings.anthropicApiKey) throw new Error('Configura tu Anthropic API key en Ajustes.');
          const data = await fileToBase64(pdfFile);
          parsed = await extractScheduleWithClaude(
            { apiKey: settings.anthropicApiKey, pdfBase64: data },
            baseDate,
          );
        } else {
          const extracted = await pdfFileToText(pdfFile);
          parsed = parseScheduleText(extracted, baseDate);
        }
      } else if (tab === 'html') {
        if (!text.trim()) throw new Error('Pega el HTML.');
        const plain = await htmlToText(text);
        parsed = useClaude
          ? await extractScheduleWithClaude(
              { apiKey: settings.anthropicApiKey!, text: plain },
              baseDate,
            )
          : parseScheduleText(plain, baseDate);
      } else if (tab === 'url') {
        if (!url.trim()) throw new Error('Introduce una URL.');
        const html = await fetchUrlViaProxy(url.trim());
        const plain = await htmlToText(html);
        parsed = useClaude
          ? await extractScheduleWithClaude(
              { apiKey: settings.anthropicApiKey!, text: plain },
              baseDate,
            )
          : parseScheduleText(plain, baseDate);
      } else {
        if (!text.trim()) throw new Error('Pega el lineup.');
        parsed = useClaude
          ? await extractScheduleWithClaude(
              { apiKey: settings.anthropicApiKey!, text },
              baseDate,
            )
          : parseScheduleText(text, baseDate);
      }
      setPreview(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!preview) return;
    const next = applyParsedToFestival(festival, preview, { merge });
    await upsertFestival(next);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl bg-ink-900 border border-ink-700 rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-auto pb-safe">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Importar lineup</h3>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-100">✕</button>
        </div>

        <div className="flex gap-1 mb-4 text-sm flex-wrap">
          {(['text', 'image', 'pdf', 'html', 'url'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full transition ${
                tab === t ? 'bg-ink-700 text-ink-100' : 'bg-ink-800 text-ink-300'
              }`}
            >
              {t === 'text' ? 'Texto' : t === 'image' ? 'Foto' : t === 'pdf' ? 'PDF' : t === 'html' ? 'HTML' : 'URL'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-ink-300">Día base:</span>
            <input
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
              className="bg-ink-800 border border-ink-700 rounded px-2 py-1 text-ink-100"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={merge}
              onChange={(e) => setMerge(e.target.checked)}
              className="accent-accent-500"
            />
            <span>Añadir a lo existente</span>
          </label>
          {tab !== 'image' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useClaude}
                onChange={(e) => setUseClaude(e.target.checked)}
                className="accent-accent-500"
              />
              <span>Usar Claude API</span>
            </label>
          )}
        </div>

        {tab === 'text' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={`MAIN STAGE\n22:00 - 23:30  Artist Name\n23:30 - 01:00  Otro Artist\n\nRED STAGE\n22:30  Artist X`}
            className="w-full bg-ink-800 border border-ink-700 rounded-lg p-3 text-sm font-mono text-ink-100"
          />
        )}
        {tab === 'html' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Pega aquí el HTML de la página del lineup…"
            className="w-full bg-ink-800 border border-ink-700 rounded-lg p-3 text-sm font-mono text-ink-100"
          />
        )}
        {tab === 'image' && (
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        )}
        {tab === 'pdf' && (
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        )}
        {tab === 'url' && (
          <div className="space-y-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://festival.com/lineup"
              className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-ink-400">
              Se descarga vía proxy CORS (<code className="text-ink-300">{settings.corsProxy || '—'}</code>). Configúralo en Ajustes si falla.
            </p>
          </div>
        )}

        <button
          onClick={run}
          disabled={loading}
          className="mt-4 w-full py-2 rounded-lg bg-accent-500 hover:bg-accent-400 text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Procesando…' : 'Previsualizar'}
        </button>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {preview && (
          <div className="mt-4 border border-ink-700 rounded-lg p-3">
            <div className="text-xs text-ink-300 mb-2">
              {preview.stages.length} escenarios detectados ·{' '}
              {preview.stages.reduce((n, s) => n + s.sets.length, 0)} sets
            </div>
            {preview.warnings.length > 0 && (
              <ul className="text-xs text-yellow-400 mb-2 list-disc pl-4">
                {preview.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
            <div className="max-h-48 overflow-auto text-xs space-y-2">
              {preview.stages.map((s) => (
                <div key={s.name}>
                  <div className="font-semibold text-ink-100">{s.name}</div>
                  <ul className="text-ink-300 pl-3">
                    {s.sets.map((set, i) => (
                      <li key={i}>
                        {new Date(set.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(set.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {'  '}
                        {set.artist}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button
              onClick={apply}
              className="mt-3 w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
            >
              Añadir al festival
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
