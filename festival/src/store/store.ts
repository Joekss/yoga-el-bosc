import { create } from 'zustand';
import type { AppSettings, ArtistSet, Festival, Stage } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import * as db from './db';

interface AppState {
  festivals: Festival[];
  settings: AppSettings;
  loaded: boolean;
  init: () => Promise<void>;
  upsertFestival: (festival: Festival) => Promise<void>;
  removeFestival: (id: string) => Promise<void>;
  updateSet: (festivalId: string, setId: string, patch: Partial<ArtistSet>) => Promise<void>;
  addSet: (festivalId: string, set: ArtistSet) => Promise<void>;
  removeSet: (festivalId: string, setId: string) => Promise<void>;
  addStage: (festivalId: string, stage: Stage) => Promise<void>;
  updateStage: (festivalId: string, stageId: string, patch: Partial<Stage>) => Promise<void>;
  removeStage: (festivalId: string, stageId: string) => Promise<void>;
  moveStage: (festivalId: string, stageId: string, direction: -1 | 1) => Promise<void>;
  setSettings: (patch: Partial<AppSettings>) => Promise<void>;
  importBackup: (data: { festivals?: Festival[]; settings?: Partial<AppSettings> }, mode: 'merge' | 'replace') => Promise<{ imported: number }>;
}

function bumpUpdated(f: Festival): Festival {
  return { ...f, updatedAt: new Date().toISOString() };
}

export const useStore = create<AppState>((setState, getState) => ({
  festivals: [],
  settings: DEFAULT_SETTINGS,
  loaded: false,

  async init() {
    const [festivals, settings] = await Promise.all([db.loadFestivals(), db.loadSettings()]);
    setState({ festivals, settings, loaded: true });
  },

  async upsertFestival(festival) {
    const next = bumpUpdated(festival);
    await db.saveFestival(next);
    const list = getState().festivals.filter((f) => f.id !== next.id);
    list.push(next);
    list.sort((a, b) => a.startDate.localeCompare(b.startDate));
    setState({ festivals: list });
  },

  async removeFestival(id) {
    await db.deleteFestival(id);
    setState({ festivals: getState().festivals.filter((f) => f.id !== id) });
  },

  async updateSet(festivalId, setId, patch) {
    const f = getState().festivals.find((x) => x.id === festivalId);
    if (!f) return;
    const sets = f.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s));
    await getState().upsertFestival({ ...f, sets });
  },

  async addSet(festivalId, s) {
    const f = getState().festivals.find((x) => x.id === festivalId);
    if (!f) return;
    await getState().upsertFestival({ ...f, sets: [...f.sets, s] });
  },

  async removeSet(festivalId, setId) {
    const f = getState().festivals.find((x) => x.id === festivalId);
    if (!f) return;
    await getState().upsertFestival({ ...f, sets: f.sets.filter((s) => s.id !== setId) });
  },

  async addStage(festivalId, stage) {
    const f = getState().festivals.find((x) => x.id === festivalId);
    if (!f) return;
    await getState().upsertFestival({ ...f, stages: [...f.stages, stage] });
  },

  async updateStage(festivalId, stageId, patch) {
    const f = getState().festivals.find((x) => x.id === festivalId);
    if (!f) return;
    const stages = f.stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s));
    await getState().upsertFestival({ ...f, stages });
  },

  async removeStage(festivalId, stageId) {
    const f = getState().festivals.find((x) => x.id === festivalId);
    if (!f) return;
    const stages = f.stages.filter((s) => s.id !== stageId);
    const sets = f.sets.filter((s) => s.stageId !== stageId);
    await getState().upsertFestival({ ...f, stages, sets });
  },

  async moveStage(festivalId, stageId, direction) {
    const f = getState().festivals.find((x) => x.id === festivalId);
    if (!f) return;
    const idx = f.stages.findIndex((s) => s.id === stageId);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= f.stages.length) return;
    const stages = [...f.stages];
    [stages[idx], stages[target]] = [stages[target], stages[idx]];
    await getState().upsertFestival({ ...f, stages });
  },

  async setSettings(patch) {
    const next = { ...getState().settings, ...patch };
    await db.saveSettings(next);
    setState({ settings: next });
  },

  async importBackup(data, mode) {
    const incoming = (data.festivals || []).filter((f): f is Festival => !!f?.id && !!f?.name);
    const current = mode === 'replace' ? [] : getState().festivals;
    const byId = new Map(current.map((f) => [f.id, f]));
    for (const f of incoming) byId.set(f.id, f);
    const merged = [...byId.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));

    if (mode === 'replace') {
      for (const f of current) await db.deleteFestival(f.id);
    }
    for (const f of incoming) await db.saveFestival(f);

    let settings = getState().settings;
    if (data.settings) {
      settings = { ...settings, ...data.settings };
      await db.saveSettings(settings);
    }
    setState({ festivals: merged, settings });
    return { imported: incoming.length };
  },
}));
