'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { storage } from '@/services/storage';
import * as db from '@/services/db';
import type {
  PatientProfile,
  ChatSession,
  HealthInsight,
  Message,
  ActionItem,
  AppTab,
} from '@/types';

// Generate unique IDs (fallback for optimistic updates)
const generateId = () => Math.random().toString(36).substring(2, 15);

interface AppContextValue {
  // State
  profile: PatientProfile | null;
  sessions: ChatSession[];
  insights: HealthInsight[];
  activeSessionId: string | null;
  activeTab: AppTab;
  isLoading: boolean;
  streamingReasoning: string;
  isApiKeySet: boolean;
  isDataLoading: boolean;
  hasPendingMigration: boolean;

  // Computed
  activeSession: ChatSession | null;

  // Profile actions
  updateProfile: (profile: PatientProfile) => void;

  // Session actions
  createSession: (title?: string) => ChatSession;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSession: (session: ChatSession) => void;
  updateSessionFields: (sessionId: string, fields: Partial<Pick<ChatSession, 'questionCount' | 'isSummaryMode' | 'hasRedFlag'>>) => void;

  // Message actions
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => Message;

  // Action item actions
  addActionItems: (sessionId: string, items: Omit<ActionItem, 'id' | 'sessionId' | 'createdAt' | 'completed'>[]) => void;
  toggleActionItem: (sessionId: string, itemId: string) => void;

  // Insight actions
  addInsights: (newInsights: Omit<HealthInsight, 'id' | 'createdAt'>[]) => void;

  // UI actions
  setActiveTab: (tab: AppTab) => void;
  setIsLoading: (loading: boolean) => void;
  setStreamingReasoning: (text: string) => void;
  setIsApiKeySet: (isSet: boolean) => void;

  // Migration actions
  migrateLocalData: () => Promise<void>;
  skipMigration: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();

  // State
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [hasPendingMigration, setHasPendingMigration] = useState(false);

  // Computed values
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      // Clear state when logged out
      setProfile(null);
      setSessions([]);
      setInsights([]);
      setActiveSessionId(null);
      setIsDataLoading(false);
      return;
    }

    // Load data from Supabase
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const [profileData, sessionsData, insightsData] = await Promise.all([
          db.getProfile(user.id),
          db.getSessions(user.id),
          db.getInsights(user.id),
        ]);

        setProfile(profileData);
        setSessions(sessionsData);
        setInsights(insightsData);

        // Check for localStorage data to migrate
        const localProfile = storage.profile.get();
        const localSessions = storage.sessions.getAll();
        const localInsights = storage.insights.getAll();

        if (
          (localProfile || localSessions.length > 0 || localInsights.length > 0) &&
          sessionsData.length === 0 // Only offer migration if no existing cloud data
        ) {
          setHasPendingMigration(true);
        }
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [user, isAuthLoading]);

  // Profile actions
  const updateProfile = useCallback((newProfile: PatientProfile) => {
    setProfile(newProfile);

    // Save to Supabase
    if (user) {
      db.updateProfile(user.id, newProfile).catch((error) => {
        console.error('Error saving profile to Supabase:', error);
      });
    }
  }, [user]);

  // Session actions
  const createSession = useCallback((title?: string): ChatSession => {
    const tempId = generateId();
    const now = new Date().toISOString();

    const newSession: ChatSession = {
      id: tempId,
      title: title || 'New Conversation',
      createdAt: now,
      updatedAt: now,
      messages: [],
      actionItems: [],
      questionCount: 0,
      isSummaryMode: false,
      hasRedFlag: false,
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(tempId);

    // Create in Supabase and update with real ID
    if (user) {
      db.createSession(user.id, title).then((created) => {
        setSessions((prev) =>
          prev.map((s) => (s.id === tempId ? { ...s, id: created.id } : s))
        );
        setActiveSessionId(created.id);
      }).catch((error) => {
        console.error('Error creating session in Supabase:', error);
      });
    }

    return newSession;
  }, [user]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setInsights((prev) => prev.filter((i) => i.sourceSessionId !== sessionId));

    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }

    // Delete from Supabase
    db.deleteSession(sessionId).catch((error) => {
      console.error('Error deleting session from Supabase:', error);
    });

    // Also delete insights associated with session
    db.deleteInsightsBySession(sessionId).catch((error) => {
      console.error('Error deleting insights from Supabase:', error);
    });
  }, [activeSessionId]);

  const updateSession = useCallback((updatedSession: ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );

    // Update in Supabase
    db.updateSession(updatedSession.id, {
      title: updatedSession.title,
      questionCount: updatedSession.questionCount,
      isSummaryMode: updatedSession.isSummaryMode,
      hasRedFlag: updatedSession.hasRedFlag,
    }).catch((error) => {
      console.error('Error updating session in Supabase:', error);
    });
  }, []);

  const updateSessionFields = useCallback(
    (sessionId: string, fields: Partial<Pick<ChatSession, 'questionCount' | 'isSummaryMode' | 'hasRedFlag'>>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, ...fields, updatedAt: new Date().toISOString() }
            : s
        )
      );

      // Update in Supabase
      db.updateSession(sessionId, fields).catch((error) => {
        console.error('Error updating session fields in Supabase:', error);
      });
    },
    []
  );

  // Message actions
  const addMessage = useCallback(
    (sessionId: string, messageData: Omit<Message, 'id' | 'timestamp'>): Message => {
      const tempId = generateId();
      const now = new Date().toISOString();

      const message: Message = {
        ...messageData,
        id: tempId,
        timestamp: now,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [...s.messages, message],
                updatedAt: now,
                title:
                  s.title === 'New Conversation' && messageData.role === 'user'
                    ? messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : '')
                    : s.title,
              }
            : s
        )
      );

      // Also update title in Supabase if it changed
      const session = sessions.find((s) => s.id === sessionId);
      if (session?.title === 'New Conversation' && messageData.role === 'user') {
        const newTitle = messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : '');
        db.updateSession(sessionId, { title: newTitle }).catch((error) => {
          console.error('Error updating session title in Supabase:', error);
        });
      }

      // Add to Supabase
      db.addMessage(sessionId, messageData).then((savedMessage) => {
        // Update with real ID from Supabase
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === tempId ? { ...m, id: savedMessage.id } : m
                  ),
                }
              : s
          )
        );
      }).catch((error) => {
        console.error('Error adding message to Supabase:', error);
      });

      return message;
    },
    [sessions]
  );

  // Action item actions
  const addActionItems = useCallback(
    (sessionId: string, items: Omit<ActionItem, 'id' | 'sessionId' | 'createdAt' | 'completed'>[]) => {
      const tempItems: ActionItem[] = items.map((item) => ({
        ...item,
        id: generateId(),
        sessionId,
        createdAt: new Date().toISOString(),
        completed: false,
      }));

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, actionItems: [...s.actionItems, ...tempItems] }
            : s
        )
      );

      // Add to Supabase
      db.addActionItems(sessionId, items).then((savedItems) => {
        // Update with real IDs from Supabase
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  actionItems: s.actionItems.map((a, index) => {
                    const tempItem = tempItems.find((t) => t.id === a.id);
                    if (tempItem && savedItems[tempItems.indexOf(tempItem)]) {
                      return { ...a, id: savedItems[tempItems.indexOf(tempItem)].id };
                    }
                    return a;
                  }),
                }
              : s
          )
        );
      }).catch((error) => {
        console.error('Error adding action items to Supabase:', error);
      });
    },
    []
  );

  const toggleActionItem = useCallback((sessionId: string, itemId: string) => {
    let newCompletedState = false;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              actionItems: s.actionItems.map((item) => {
                if (item.id === itemId) {
                  newCompletedState = !item.completed;
                  return { ...item, completed: newCompletedState };
                }
                return item;
              }),
            }
          : s
      )
    );

    // Update in Supabase
    db.toggleActionItem(itemId, newCompletedState).catch((error) => {
      console.error('Error toggling action item in Supabase:', error);
    });
  }, []);

  // Insight actions
  const addInsightsAction = useCallback(
    (newInsights: Omit<HealthInsight, 'id' | 'createdAt'>[]) => {
      const tempInsights: HealthInsight[] = newInsights.map((insight) => ({
        ...insight,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }));

      setInsights((prev) => [...tempInsights, ...prev]);

      // Add to Supabase
      if (user && newInsights.length > 0) {
        const sourceSessionId = newInsights[0].sourceSessionId;
        db.addInsights(user.id, sourceSessionId, newInsights).then((savedInsights) => {
          // Update with real IDs from Supabase
          setInsights((prev) =>
            prev.map((insight) => {
              const tempInsight = tempInsights.find((t) => t.id === insight.id);
              if (tempInsight) {
                const savedIndex = tempInsights.indexOf(tempInsight);
                if (savedInsights[savedIndex]) {
                  return { ...insight, id: savedInsights[savedIndex].id };
                }
              }
              return insight;
            })
          );
        }).catch((error) => {
          console.error('Error adding insights to Supabase:', error);
        });
      }
    },
    [user]
  );

  // Migration actions
  const migrateLocalData = useCallback(async () => {
    if (!user) return;

    try {
      const localProfile = storage.profile.get();
      const localSessions = storage.sessions.getAll();
      const localInsights = storage.insights.getAll();

      await db.migrateFromLocalStorage(user.id, localProfile, localSessions, localInsights);

      // Clear localStorage after successful migration
      storage.clearAll();
      setHasPendingMigration(false);

      // Reload data from Supabase
      const [profileData, sessionsData, insightsData] = await Promise.all([
        db.getProfile(user.id),
        db.getSessions(user.id),
        db.getInsights(user.id),
      ]);

      setProfile(profileData);
      setSessions(sessionsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error migrating local data:', error);
      throw error;
    }
  }, [user]);

  const skipMigration = useCallback(() => {
    storage.clearAll();
    setHasPendingMigration(false);
  }, []);

  const value: AppContextValue = {
    // State
    profile,
    sessions,
    insights,
    activeSessionId,
    activeTab,
    isLoading,
    streamingReasoning,
    isApiKeySet,
    isDataLoading,
    hasPendingMigration,

    // Computed
    activeSession,

    // Actions
    updateProfile,
    createSession,
    selectSession,
    deleteSession,
    updateSession,
    updateSessionFields,
    addMessage,
    addActionItems,
    toggleActionItem,
    addInsights: addInsightsAction,
    setActiveTab,
    setIsLoading,
    setStreamingReasoning,
    setIsApiKeySet,
    migrateLocalData,
    skipMigration,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
