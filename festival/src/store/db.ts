import { get, set, del, keys } from 'idb-keyval';
import type { AppSettings, Festival } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const FESTIVAL_PREFIX = 'festival:';
const SETTINGS_KEY = 'app:settings';

export async function loadFestivals(): Promise<Festival[]> {
  const all = await keys();
  const festivalKeys = all.filter((k): k is string => typeof k === 'string' && k.startsWith(FESTIVAL_PREFIX));
  const items = await Promise.all(festivalKeys.map((k) => get<Festival>(k)));
  return items.filter((x): x is Festival => !!x).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function saveFestival(festival: Festival): Promise<void> {
  await set(FESTIVAL_PREFIX + festival.id, festival);
}

export async function deleteFestival(id: string): Promise<void> {
  await del(FESTIVAL_PREFIX + id);
}

export async function loadSettings(): Promise<AppSettings> {
  const stored = await get<AppSettings>(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored || {}) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await set(SETTINGS_KEY, settings);
}
