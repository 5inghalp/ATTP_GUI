// User (from Supabase Auth)
export interface User {
  id: string;
  email: string;
}

// Patient Profile
export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  medications: Medication[];
  conditions: string[];
  allergies: string[];
}

export interface Medication {
  name: string;
  dosage?: string;
}

// Chat Session
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  actionItems: ActionItem[];
  questionCount: number;
  isSummaryMode: boolean;
  hasRedFlag: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: ReasoningStep[];
  timestamp: string;
}

// Reasoning Steps (displayed in panel)
export interface ReasoningStep {
  id: string;
  type: 'question_rationale' | 'analysis' | 'safety_flag';
  content: string;
  timestamp: string;
}

// Health Insights (extracted from conversations)
export interface HealthInsight {
  id: string;
  category: HealthCategory;
  content: string;
  sourceSessionId: string;
  createdAt: string;
}

export type HealthCategory = 'sleep' | 'energy' | 'digestion' | 'pain' | 'mood' | 'other';

// Action Items
export interface ActionItem {
  id: string;
  task: string;
  why: string;
  urgency: 'routine' | 'urgent';
  completed: boolean;
  sessionId: string;
  createdAt: string;
}

// App State
export interface AppState {
  profile: PatientProfile | null;
  sessions: ChatSession[];
  insights: HealthInsight[];
  activeSessionId: string | null;
  activeTab: AppTab;
}

export type AppTab = 'chat' | 'profile' | 'trends';

// AI Response parsed structure
export interface ParsedAIResponse {
  answer: string;
  followUpQuestion?: string;
  reasoning?: string;
  actionItems?: Omit<ActionItem, 'id' | 'sessionId' | 'createdAt' | 'completed'>[];
  insights?: Omit<HealthInsight, 'id' | 'sourceSessionId' | 'createdAt'>[];
  isSummary: boolean;
  isRedFlag: boolean;
}
