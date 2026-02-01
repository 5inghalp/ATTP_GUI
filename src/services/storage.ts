import type { PatientProfile, ChatSession, HealthInsight } from '@/types';

const STORAGE_KEYS = {
  PROFILE: 'restore_health_profile',
  SESSIONS: 'restore_health_sessions',
  INSIGHTS: 'restore_health_insights',
} as const;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

// Profile operations
export function getProfile(): PatientProfile | null {
  return getItem<PatientProfile | null>(STORAGE_KEYS.PROFILE, null);
}

export function saveProfile(profile: PatientProfile): void {
  setItem(STORAGE_KEYS.PROFILE, profile);
}

export function clearProfile(): void {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
}

// Sessions operations
export function getSessions(): ChatSession[] {
  return getItem<ChatSession[]>(STORAGE_KEYS.SESSIONS, []);
}

export function saveSessions(sessions: ChatSession[]): void {
  setItem(STORAGE_KEYS.SESSIONS, sessions);
}

export function saveSession(session: ChatSession): void {
  const sessions = getSessions();
  const existingIndex = sessions.findIndex((s) => s.id === session.id);

  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.unshift(session);
  }

  saveSessions(sessions);
}

export function deleteSession(sessionId: string): void {
  const sessions = getSessions().filter((s) => s.id !== sessionId);
  saveSessions(sessions);
}

// Insights operations
export function getInsights(): HealthInsight[] {
  return getItem<HealthInsight[]>(STORAGE_KEYS.INSIGHTS, []);
}

export function saveInsights(insights: HealthInsight[]): void {
  setItem(STORAGE_KEYS.INSIGHTS, insights);
}

export function addInsight(insight: HealthInsight): void {
  const insights = getInsights();
  insights.unshift(insight);
  saveInsights(insights);
}

export function addInsights(newInsights: HealthInsight[]): void {
  const insights = getInsights();
  saveInsights([...newInsights, ...insights]);
}

export function deleteInsightsBySession(sessionId: string): void {
  const insights = getInsights().filter((i) => i.sourceSessionId !== sessionId);
  saveInsights(insights);
}

// Clear all data
export function clearAllData(): void {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.INSIGHTS);
}

// Export storage service object for convenience
export const storage = {
  profile: {
    get: getProfile,
    save: saveProfile,
    clear: clearProfile,
  },
  sessions: {
    getAll: getSessions,
    saveAll: saveSessions,
    save: saveSession,
    delete: deleteSession,
  },
  insights: {
    getAll: getInsights,
    saveAll: saveInsights,
    add: addInsight,
    addMany: addInsights,
    deleteBySession: deleteInsightsBySession,
  },
  clearAll: clearAllData,
};
