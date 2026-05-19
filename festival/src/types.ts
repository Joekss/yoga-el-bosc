export type SetStatus = 'must' | 'maybe' | 'skip' | null;

export interface Stage {
  id: string;
  name: string;
  color: string;
}

export interface ArtistSet {
  id: string;
  festivalId: string;
  stageId: string;
  artist: string;
  /** ISO datetime with timezone offset */
  start: string;
  /** ISO datetime with timezone offset */
  end: string;
  notes?: string;
  status: SetStatus;
  /** Custom highlight color overriding status color */
  highlight?: string;
  /** Minutes before start to fire a local notification */
  alarmMinutesBefore?: number | null;
}

export interface Festival {
  id: string;
  name: string;
  location?: string;
  /** Festival start day in YYYY-MM-DD */
  startDate: string;
  /** Festival end day in YYYY-MM-DD */
  endDate: string;
  timezone?: string;
  stages: Stage[];
  sets: ArtistSet[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  anthropicApiKey?: string;
  defaultAlarmMinutes: number;
  theme: 'dark' | 'light';
  /** Pixels per minute in timetable view */
  zoom: number;
  /** CORS proxy used when fetching festival URLs from the browser */
  corsProxy: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultAlarmMinutes: 10,
  theme: 'dark',
  zoom: 1.2,
  corsProxy: 'https://corsproxy.io/?',
};

export const STATUS_COLORS: Record<NonNullable<SetStatus>, string> = {
  must: '#10b981',
  maybe: '#eab308',
  skip: '#6b7280',
};
