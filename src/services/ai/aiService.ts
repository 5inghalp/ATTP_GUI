import {
  initializeClient,
  isClientInitialized,
  streamMessage,
} from './claudeProvider';
import { getRelevantInsights } from './contextBuilder';
import {
  parseAIResponse,
  getDisplayContent,
  buildReasoningStep,
} from './responseParser';
import type {
  PatientProfile,
  ChatSession,
  HealthInsight,
  ReasoningStep,
  ActionItem,
} from '@/types';

// Re-export initialization functions
export { initializeClient, isClientInitialized };

export interface AIResponseCallbacks {
  onStreamingText: (text: string) => void;
  onReasoningUpdate: (reasoning: string) => void;
  onComplete: (result: AIResponseResult) => void;
  onError: (error: Error) => void;
}

export interface AIResponseResult {
  displayContent: string;
  reasoning: ReasoningStep | null;
  actionItems: Omit<ActionItem, 'id' | 'sessionId' | 'createdAt' | 'completed'>[];
  insights: Omit<HealthInsight, 'id' | 'sourceSessionId' | 'createdAt'>[];
  isSummary: boolean;
  isRedFlag: boolean;
  rawResponse: string;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

/**
 * Sends a message to the AI and streams the response
 */
export async function sendHealthMessage(
  session: ChatSession,
  profile: PatientProfile | null,
  allInsights: HealthInsight[],
  callbacks: AIResponseCallbacks
): Promise<void> {
  // Get insights from other sessions (not current)
  const relevantInsights = getRelevantInsights(allInsights, session.id);

  let fullResponse = '';
  let currentStreamText = '';

  await streamMessage(
    { session, profile, insights: relevantInsights },
    {
      onText: (text) => {
        fullResponse += text;
        currentStreamText += text;

        // Send streaming text for display
        callbacks.onStreamingText(text);

        // Check for reasoning section as it streams
        const reasoningMatch = currentStreamText.match(/<reasoning>([\s\S]*?)(?:<\/reasoning>|$)/);
        if (reasoningMatch && reasoningMatch[1]) {
          callbacks.onReasoningUpdate(reasoningMatch[1].trim());
        }
      },
      onComplete: (completeText) => {
        // Parse the complete response
        const parsed = parseAIResponse(completeText);
        const displayContent = getDisplayContent(parsed);
        const reasoningStep = buildReasoningStep(parsed);

        const result: AIResponseResult = {
          displayContent,
          reasoning: reasoningStep
            ? {
                id: generateId(),
                type: reasoningStep.type,
                content: reasoningStep.content,
                timestamp: new Date().toISOString(),
              }
            : null,
          actionItems: parsed.actionItems || [],
          insights: parsed.insights || [],
          isSummary: parsed.isSummary,
          isRedFlag: parsed.isRedFlag,
          rawResponse: completeText,
        };

        callbacks.onComplete(result);
      },
      onError: callbacks.onError,
    }
  );
}

/**
 * Generates a title for a session based on the first user message
 */
export function generateSessionTitle(firstMessage: string): string {
  // Truncate and clean up for title
  const cleaned = firstMessage
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= 50) {
    return cleaned;
  }

  return cleaned.substring(0, 47) + '...';
}
