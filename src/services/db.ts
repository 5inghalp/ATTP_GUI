import { getSupabaseClient } from '@/lib/supabase';
import type {
  PatientProfile,
  ChatSession,
  Message,
  ActionItem,
  HealthInsight,
  ReasoningStep,
} from '@/types';

// Database row types (matching Supabase schema)
interface ProfileRow {
  id: string;
  name: string | null;
  age: number | null;
  sex: string | null;
  created_at: string;
}

interface MedicationRow {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  created_at: string;
}

interface ConditionRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

interface AllergyRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string;
  question_count: number;
  is_summary_mode: boolean;
  has_red_flag: boolean;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning: unknown;
  created_at: string;
}

interface ActionItemRow {
  id: string;
  session_id: string;
  task: string;
  why: string | null;
  urgency: 'routine' | 'urgent';
  completed: boolean;
  created_at: string;
}

interface HealthInsightRow {
  id: string;
  user_id: string;
  source_session_id: string | null;
  category: 'sleep' | 'energy' | 'digestion' | 'pain' | 'mood' | 'other';
  content: string;
  created_at: string;
}

// ============================================
// Profile Operations
// ============================================

export async function getProfile(userId: string): Promise<PatientProfile | null> {
  const supabase = getSupabaseClient();

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    return null;
  }

  const profileData = profile as ProfileRow;

  // Get medications
  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId);

  // Get conditions
  const { data: conditions } = await supabase
    .from('conditions')
    .select('*')
    .eq('user_id', userId);

  // Get allergies
  const { data: allergies } = await supabase
    .from('allergies')
    .select('*')
    .eq('user_id', userId);

  const medicationsData = (medications || []) as MedicationRow[];
  const conditionsData = (conditions || []) as ConditionRow[];
  const allergiesData = (allergies || []) as AllergyRow[];

  return {
    id: profileData.id,
    name: profileData.name || '',
    age: profileData.age || 0,
    sex: (profileData.sex as 'male' | 'female' | 'other') || 'other',
    medications: medicationsData.map((m) => ({
      name: m.name,
      dosage: m.dosage || undefined,
    })),
    conditions: conditionsData.map((c) => c.name),
    allergies: allergiesData.map((a) => a.name),
  };
}

export async function updateProfile(
  userId: string,
  profile: PatientProfile
): Promise<void> {
  const supabase = getSupabaseClient();

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name: profile.name,
      age: profile.age,
      sex: profile.sex,
    });

  if (profileError) {
    console.error('Error updating profile:', profileError);
    throw profileError;
  }

  // Delete existing medications, conditions, allergies and re-insert
  await Promise.all([
    supabase.from('medications').delete().eq('user_id', userId),
    supabase.from('conditions').delete().eq('user_id', userId),
    supabase.from('allergies').delete().eq('user_id', userId),
  ]);

  // Insert new medications
  if (profile.medications.length > 0) {
    await supabase.from('medications').insert(
      profile.medications.map((m) => ({
        user_id: userId,
        name: m.name,
        dosage: m.dosage || null,
      }))
    );
  }

  // Insert new conditions
  if (profile.conditions.length > 0) {
    await supabase.from('conditions').insert(
      profile.conditions.map((name) => ({
        user_id: userId,
        name,
      }))
    );
  }

  // Insert new allergies
  if (profile.allergies.length > 0) {
    await supabase.from('allergies').insert(
      profile.allergies.map((name) => ({
        user_id: userId,
        name,
      }))
    );
  }
}

// ============================================
// Session Operations
// ============================================

export async function getSessions(userId: string): Promise<ChatSession[]> {
  const supabase = getSupabaseClient();

  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  const sessionsData = (sessions || []) as ChatSessionRow[];

  // Fetch messages and action items for each session
  const sessionsWithData = await Promise.all(
    sessionsData.map(async (session) => {
      const [messagesResult, actionItemsResult] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('action_items')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true }),
      ]);

      const messagesData = (messagesResult.data || []) as MessageRow[];
      const actionItemsData = (actionItemsResult.data || []) as ActionItemRow[];

      const messages: Message[] = messagesData.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        reasoning: m.reasoning as ReasoningStep[] | undefined,
        timestamp: m.created_at,
      }));

      const actionItems: ActionItem[] = actionItemsData.map((a) => ({
        id: a.id,
        task: a.task,
        why: a.why || '',
        urgency: a.urgency,
        completed: a.completed,
        sessionId: a.session_id,
        createdAt: a.created_at,
      }));

      return {
        id: session.id,
        title: session.title,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        messages,
        actionItems,
        questionCount: session.question_count,
        isSummaryMode: session.is_summary_mode,
        hasRedFlag: session.has_red_flag,
      };
    })
  );

  return sessionsWithData;
}

export async function createSession(
  userId: string,
  title: string = 'New Conversation'
): Promise<ChatSession> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating session:', error);
    throw error;
  }

  const sessionData = data as ChatSessionRow;

  return {
    id: sessionData.id,
    title: sessionData.title,
    createdAt: sessionData.created_at,
    updatedAt: sessionData.updated_at,
    messages: [],
    actionItems: [],
    questionCount: sessionData.question_count,
    isSummaryMode: sessionData.is_summary_mode,
    hasRedFlag: sessionData.has_red_flag,
  };
}

export async function updateSession(
  sessionId: string,
  updates: Partial<{
    title: string;
    questionCount: number;
    isSummaryMode: boolean;
    hasRedFlag: boolean;
  }>
): Promise<void> {
  const supabase = getSupabaseClient();

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.questionCount !== undefined) dbUpdates.question_count = updates.questionCount;
  if (updates.isSummaryMode !== undefined) dbUpdates.is_summary_mode = updates.isSummaryMode;
  if (updates.hasRedFlag !== undefined) dbUpdates.has_red_flag = updates.hasRedFlag;

  const { error } = await supabase
    .from('chat_sessions')
    .update(dbUpdates)
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

// ============================================
// Message Operations
// ============================================

export async function addMessage(
  sessionId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<Message> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      reasoning: message.reasoning as unknown as Record<string, unknown>,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error adding message:', error);
    throw error;
  }

  const messageData = data as MessageRow;

  // Update session timestamp
  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  return {
    id: messageData.id,
    role: messageData.role,
    content: messageData.content,
    reasoning: messageData.reasoning as ReasoningStep[] | undefined,
    timestamp: messageData.created_at,
  };
}

// ============================================
// Action Item Operations
// ============================================

export async function addActionItems(
  sessionId: string,
  items: Omit<ActionItem, 'id' | 'sessionId' | 'createdAt' | 'completed'>[]
): Promise<ActionItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('action_items')
    .insert(
      items.map((item) => ({
        session_id: sessionId,
        task: item.task,
        why: item.why,
        urgency: item.urgency,
        completed: false,
      }))
    )
    .select();

  if (error) {
    console.error('Error adding action items:', error);
    throw error;
  }

  const actionItemsData = (data || []) as ActionItemRow[];

  return actionItemsData.map((a) => ({
    id: a.id,
    task: a.task,
    why: a.why || '',
    urgency: a.urgency,
    completed: a.completed,
    sessionId: a.session_id,
    createdAt: a.created_at,
  }));
}

export async function toggleActionItem(
  itemId: string,
  completed: boolean
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('action_items')
    .update({ completed })
    .eq('id', itemId);

  if (error) {
    console.error('Error toggling action item:', error);
    throw error;
  }
}

// ============================================
// Health Insight Operations
// ============================================

export async function getInsights(userId: string): Promise<HealthInsight[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('health_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching insights:', error);
    return [];
  }

  const insightsData = (data || []) as HealthInsightRow[];

  return insightsData.map((i) => ({
    id: i.id,
    category: i.category,
    content: i.content,
    sourceSessionId: i.source_session_id || '',
    createdAt: i.created_at,
  }));
}

export async function addInsights(
  userId: string,
  sourceSessionId: string,
  insights: Omit<HealthInsight, 'id' | 'sourceSessionId' | 'createdAt'>[]
): Promise<HealthInsight[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('health_insights')
    .insert(
      insights.map((insight) => ({
        user_id: userId,
        source_session_id: sourceSessionId,
        category: insight.category,
        content: insight.content,
      }))
    )
    .select();

  if (error) {
    console.error('Error adding insights:', error);
    throw error;
  }

  const insightsData = (data || []) as HealthInsightRow[];

  return insightsData.map((i) => ({
    id: i.id,
    category: i.category,
    content: i.content,
    sourceSessionId: i.source_session_id || '',
    createdAt: i.created_at,
  }));
}

export async function deleteInsightsBySession(sessionId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('health_insights')
    .delete()
    .eq('source_session_id', sessionId);

  if (error) {
    console.error('Error deleting insights:', error);
    throw error;
  }
}

// ============================================
// Migration from localStorage
// ============================================

export async function migrateFromLocalStorage(
  userId: string,
  profile: PatientProfile | null,
  sessions: ChatSession[],
  insights: HealthInsight[]
): Promise<void> {
  const supabase = getSupabaseClient();

  // Migrate profile
  if (profile) {
    await updateProfile(userId, profile);
  }

  // Migrate sessions
  for (const session of sessions) {
    // Create session
    const { data: newSession, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: session.title,
        question_count: session.questionCount,
        is_summary_mode: session.isSummaryMode,
        has_red_flag: session.hasRedFlag,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
      })
      .select()
      .single();

    if (sessionError || !newSession) {
      console.error('Error migrating session:', sessionError);
      continue;
    }

    const newSessionData = newSession as ChatSessionRow;

    // Migrate messages
    if (session.messages.length > 0) {
      await supabase.from('messages').insert(
        session.messages.map((m) => ({
          session_id: newSessionData.id,
          role: m.role,
          content: m.content,
          reasoning: m.reasoning as unknown as Record<string, unknown>,
          created_at: m.timestamp,
        }))
      );
    }

    // Migrate action items
    if (session.actionItems.length > 0) {
      await supabase.from('action_items').insert(
        session.actionItems.map((a) => ({
          session_id: newSessionData.id,
          task: a.task,
          why: a.why,
          urgency: a.urgency,
          completed: a.completed,
          created_at: a.createdAt,
        }))
      );
    }

    // Update insight source session IDs
    const sessionInsights = insights.filter(
      (i) => i.sourceSessionId === session.id
    );
    if (sessionInsights.length > 0) {
      await supabase.from('health_insights').insert(
        sessionInsights.map((i) => ({
          user_id: userId,
          source_session_id: newSessionData.id,
          category: i.category,
          content: i.content,
          created_at: i.createdAt,
        }))
      );
    }
  }

  // Migrate insights without session association
  const orphanInsights = insights.filter(
    (i) => !sessions.some((s) => s.id === i.sourceSessionId)
  );
  if (orphanInsights.length > 0) {
    await supabase.from('health_insights').insert(
      orphanInsights.map((i) => ({
        user_id: userId,
        source_session_id: null,
        category: i.category,
        content: i.content,
        created_at: i.createdAt,
      }))
    );
  }
}
