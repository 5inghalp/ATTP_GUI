import type { PatientProfile, ChatSession, HealthInsight, Message } from '@/types';
import { buildSystemPrompt } from '@/prompts/systemPrompt';

export interface AIContext {
  systemPrompt: string;
  messages: Message[];
}

/**
 * Builds the complete context for an AI request, including:
 * - System prompt with patient profile and accumulated insights
 * - Message history from the current session
 */
export function buildAIContext(
  session: ChatSession,
  profile: PatientProfile | null,
  allInsights: HealthInsight[]
): AIContext {
  // Build system prompt with all context
  const systemPrompt = buildSystemPrompt(
    profile,
    allInsights,
    session.questionCount
  );

  // Get messages from current session
  const messages = session.messages;

  return {
    systemPrompt,
    messages,
  };
}

/**
 * Gets insights relevant to the current conversation
 * (excluding insights from the current session to avoid circular references)
 */
export function getRelevantInsights(
  allInsights: HealthInsight[],
  currentSessionId: string
): HealthInsight[] {
  return allInsights.filter((insight) => insight.sourceSessionId !== currentSessionId);
}
