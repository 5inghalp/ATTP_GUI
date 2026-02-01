'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { storage } from '@/services/storage';
import type {
  PatientProfile,
  ChatSession,
  HealthInsight,
  Message,
  ActionItem,
  AppTab,
} from '@/types';

// Generate unique IDs
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
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage
  const [profile, setProfile] = useState<PatientProfile | null>(() => storage.profile.get());
  const [sessions, setSessions] = useState<ChatSession[]>(() => storage.sessions.getAll());
  const [insights, setInsights] = useState<HealthInsight[]>(() => storage.insights.getAll());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  // Computed values
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Persist profile changes
  useEffect(() => {
    if (profile) {
      storage.profile.save(profile);
    }
  }, [profile]);

  // Persist session changes
  useEffect(() => {
    storage.sessions.saveAll(sessions);
  }, [sessions]);

  // Persist insight changes
  useEffect(() => {
    storage.insights.saveAll(insights);
  }, [insights]);

  // Profile actions
  const updateProfile = useCallback((newProfile: PatientProfile) => {
    setProfile(newProfile);
  }, []);

  // Session actions
  const createSession = useCallback((title?: string): ChatSession => {
    const newSession: ChatSession = {
      id: generateId(),
      title: title || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      actionItems: [],
      questionCount: 0,
      isSummaryMode: false,
      hasRedFlag: false,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setInsights((prev) => prev.filter((i) => i.sourceSessionId !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  }, [activeSessionId]);

  const updateSession = useCallback((updatedSession: ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
  }, []);

  // Update specific session fields without replacing the whole session
  const updateSessionFields = useCallback(
    (sessionId: string, fields: Partial<Pick<ChatSession, 'questionCount' | 'isSummaryMode' | 'hasRedFlag'>>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, ...fields, updatedAt: new Date().toISOString() }
            : s
        )
      );
    },
    []
  );

  // Message actions
  const addMessage = useCallback(
    (sessionId: string, messageData: Omit<Message, 'id' | 'timestamp'>): Message => {
      console.log('=== AppContext.addMessage called ===');
      console.log('SessionId:', sessionId);
      console.log('Message role:', messageData.role);
      console.log('Content length:', messageData.content?.length);

      const message: Message = {
        ...messageData,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) => {
        console.log('setSessions called, prev sessions:', prev.map(s => ({ id: s.id, msgCount: s.messages.length })));
        const sessionExists = prev.some(s => s.id === sessionId);
        console.log('Session exists:', sessionExists);

        const updated = prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [...s.messages, message],
                updatedAt: new Date().toISOString(),
                // Update title from first user message if still default
                title:
                  s.title === 'New Conversation' && messageData.role === 'user'
                    ? messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : '')
                    : s.title,
              }
            : s
        );
        console.log('Updated sessions:', updated.map(s => ({ id: s.id, msgCount: s.messages.length })));
        return updated;
      });

      return message;
    },
    []
  );

  // Action item actions
  const addActionItems = useCallback(
    (sessionId: string, items: Omit<ActionItem, 'id' | 'sessionId' | 'createdAt' | 'completed'>[]) => {
      const newItems: ActionItem[] = items.map((item) => ({
        ...item,
        id: generateId(),
        sessionId,
        createdAt: new Date().toISOString(),
        completed: false,
      }));

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, actionItems: [...s.actionItems, ...newItems] }
            : s
        )
      );
    },
    []
  );

  const toggleActionItem = useCallback((sessionId: string, itemId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              actionItems: s.actionItems.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : s
      )
    );
  }, []);

  // Insight actions
  const addInsightsAction = useCallback(
    (newInsights: Omit<HealthInsight, 'id' | 'createdAt'>[]) => {
      const insightsWithIds: HealthInsight[] = newInsights.map((insight) => ({
        ...insight,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }));

      setInsights((prev) => [...insightsWithIds, ...prev]);
    },
    []
  );

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
