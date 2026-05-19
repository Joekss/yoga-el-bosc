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
  setSettings: (patch: Partial<AppSettings>) => Promise<void>;
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

  async setSettings(patch) {
    const next = { ...getState().settings, ...patch };
    await db.saveSettings(next);
    setState({ settings: next });
  },
}));
