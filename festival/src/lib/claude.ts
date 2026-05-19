import Anthropic from '@anthropic-ai/sdk';
import type { ParsedSchedule } from './parser';

const SYSTEM_PROMPT = `Extraes timetables de festivales (conciertos, música electrónica, etc.) a partir de imágenes, PDFs o texto plano.

Devuelve SIEMPRE un único bloque JSON válido con esta forma exacta:

{
  "stages": [
    {
      "name": "Main Stage",
      "sets": [
        { "artist": "Artist Name", "start": "22:00", "end": "23:30" }
      ]
    }
  ],
  "warnings": ["nota libre si algo es ambiguo"]
}

Reglas:
- Horarios en formato 24h "HH:MM".
- Si solo conoces hora de inicio, deja "end" como la siguiente hora redonda (o vacío si no puedes inferir).
- Si un set cruza medianoche, mantén la hora real (p.ej. start "23:00", end "01:30").
- Agrupa por escenario. Si solo hay un escenario, llámalo "Main".
- No incluyas texto fuera del JSON. Sin markdown.`;

export interface ClaudeExtractOptions {
  apiKey: string;
  text?: string;
  /** base64-encoded image data, no data: prefix */
  imageBase64?: string;
  imageMimeType?: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  /** PDF data as base64 */
  pdfBase64?: string;
  model?: string;
}

interface ClaudeRawSchedule {
  stages: { name: string; sets: { artist: string; start: string; end?: string }[] }[];
  warnings?: string[];
}

function timeToISO(hhmm: string, baseDate: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(`${baseDate}T00:00:00`);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

function addMinutes(iso: string, mins: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

export async function extractScheduleWithClaude(
  opts: ClaudeExtractOptions,
  baseDate: string,
): Promise<ParsedSchedule> {
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });

  const content: Anthropic.Messages.ContentBlockParam[] = [];
  if (opts.imageBase64 && opts.imageMimeType) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: opts.imageMimeType,
        data: opts.imageBase64,
      },
    });
  }
  if (opts.pdfBase64) {
    content.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: opts.pdfBase64,
      },
    });
  }
  if (opts.text) {
    content.push({ type: 'text', text: opts.text });
  }
  if (content.length === 0) {
    throw new Error('Nada que extraer: añade texto, imagen o PDF.');
  }

  const response = await client.messages.create({
    model: opts.model || 'claude-opus-4-7',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude no devolvió texto.');
  }

  const raw = textBlock.text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}$/) || raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No se encontró JSON en la respuesta.');
  }

  let parsed: ClaudeRawSchedule;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error('JSON inválido en la respuesta de Claude.');
  }

  const stages = (parsed.stages || []).map((s) => ({
    name: s.name || 'Main',
    sets: (s.sets || [])
      .filter((set) => set.artist && set.start)
      .map((set) => {
        const start = timeToISO(set.start, baseDate);
        let end = set.end ? timeToISO(set.end, baseDate) : addMinutes(start, 60);
        if (new Date(end) <= new Date(start)) {
          end = addMinutes(end, 24 * 60);
        }
        return { artist: set.artist.trim(), start, end };
      }),
  }));

  return { stages, warnings: parsed.warnings || [] };
}
