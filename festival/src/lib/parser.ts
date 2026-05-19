import type { ArtistSet, Festival, Stage } from '../types';

export interface ParsedSchedule {
  stages: { name: string; sets: { artist: string; start: string; end: string }[] }[];
  warnings: string[];
}

const TIME_RE = /\b([01]?\d|2[0-3])[:.\h]([0-5]\d)\b/g;
const RANGE_RE = /\b([01]?\d|2[0-3])[:.\h]([0-5]\d)\s*[-–—a]\s*([01]?\d|2[0-3])[:.\h]([0-5]\d)\b/;
const SINGLE_RE = /\b([01]?\d|2[0-3])[:.\h]([0-5]\d)\b/;

const STAGE_KEYWORDS = [
  /\bstage\b/i,
  /\bescenario\b/i,
  /\bmain\b/i,
  /\b(red|blue|green|yellow|purple)\s*stage/i,
  /\b(tent|carpa)\b/i,
  /\bfloor\b/i,
  /\barena\b/i,
  /\bclub\b/i,
];

const DAY_HEADER_RE = /^(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;

function looksLikeStageHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (TIME_RE.test(trimmed)) {
    TIME_RE.lastIndex = 0;
    return false;
  }
  if (STAGE_KEYWORDS.some((re) => re.test(trimmed))) return true;
  // All caps short line = likely stage header
  if (trimmed.length <= 40 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && !DAY_HEADER_RE.test(trimmed)) {
    return true;
  }
  return false;
}

function toISOTime(h: number, m: number, baseDate: string): string {
  const date = new Date(`${baseDate}T00:00:00`);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
}

function addMinutes(iso: string, mins: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

/**
 * Parse free-form text into a structured schedule.
 * Handles formats like:
 *   MAIN STAGE
 *   22:00 - 23:30  Artist Name
 *   23:30 - 01:00  Other Artist
 *
 *   RED STAGE
 *   22:30 Artist X
 */
export function parseScheduleText(input: string, baseDate: string): ParsedSchedule {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const warnings: string[] = [];
  const stages: ParsedSchedule['stages'] = [];
  let current: ParsedSchedule['stages'][number] | null = null;

  const ensureStage = (name: string) => {
    const existing = stages.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      current = existing;
    } else {
      current = { name, sets: [] };
      stages.push(current);
    }
  };

  // If no stage headers ever appear, dump into "Main"
  let foundAnyHeader = false;

  for (const line of lines) {
    if (DAY_HEADER_RE.test(line) && !TIME_RE.test(line)) {
      TIME_RE.lastIndex = 0;
      // Could update baseDate in a more advanced version
      continue;
    }
    TIME_RE.lastIndex = 0;

    if (looksLikeStageHeader(line)) {
      foundAnyHeader = true;
      ensureStage(line.replace(/[*•:#\-]+$/g, '').trim());
      continue;
    }

    const range = line.match(RANGE_RE);
    const single = !range ? line.match(SINGLE_RE) : null;

    if (!range && !single) {
      // Plain text without time — could be artist name continuation; skip
      continue;
    }

    if (!current) {
      ensureStage('Main');
    }

    let start: string;
    let end: string;
    let rest: string;
    if (range) {
      const [match, h1, m1, h2, m2] = range;
      start = toISOTime(+h1, +m1, baseDate);
      end = toISOTime(+h2, +m2, baseDate);
      // If end is before start, assume it crosses midnight
      if (new Date(end) <= new Date(start)) {
        end = addMinutes(end, 24 * 60);
      }
      rest = line.replace(match, '').trim();
    } else if (single) {
      const [match, h1, m1] = single;
      start = toISOTime(+h1, +m1, baseDate);
      end = addMinutes(start, 60); // assume 1h slots
      rest = line.replace(match, '').trim();
    } else {
      continue;
    }

    const artist = rest
      .replace(/^[\s\-–—:|·•*\.]+/, '')
      .replace(/[\s\-–—:|·•*\.]+$/, '')
      .trim();

    if (!artist) {
      warnings.push(`Línea sin nombre de artista: "${line}"`);
      continue;
    }

    current!.sets.push({ artist, start, end });
  }

  if (!foundAnyHeader && stages.length === 0) {
    warnings.push('No se detectaron escenarios; revisa el texto.');
  }

  return { stages, warnings };
}

const STAGE_PALETTE = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

export function applyParsedToFestival(
  festival: Festival,
  parsed: ParsedSchedule,
  options: { merge: boolean },
): Festival {
  const stages: Stage[] = options.merge ? [...festival.stages] : [];
  const sets: ArtistSet[] = options.merge ? [...festival.sets] : [];

  for (const ps of parsed.stages) {
    let stage = stages.find((s) => s.name.toLowerCase() === ps.name.toLowerCase());
    if (!stage) {
      stage = {
        id: crypto.randomUUID(),
        name: ps.name,
        color: STAGE_PALETTE[stages.length % STAGE_PALETTE.length],
      };
      stages.push(stage);
    }
    for (const s of ps.sets) {
      sets.push({
        id: crypto.randomUUID(),
        festivalId: festival.id,
        stageId: stage.id,
        artist: s.artist,
        start: s.start,
        end: s.end,
        status: null,
      });
    }
  }

  return { ...festival, stages, sets, updatedAt: new Date().toISOString() };
}
