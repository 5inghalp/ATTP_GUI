import type { ParsedAIResponse, HealthCategory } from '@/types';

/**
 * Parses the AI response that uses XML-like markers into structured components.
 */
export function parseAIResponse(rawResponse: string): ParsedAIResponse {
  const result: ParsedAIResponse = {
    answer: '',
    isSummary: false,
    isRedFlag: false,
  };

  // Extract <answer> section
  const answerMatch = rawResponse.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerMatch) {
    result.answer = answerMatch[1].trim();
  } else {
    // If no markers found, treat entire response as the answer
    // But strip out any XML tags that might be there
    let cleanedResponse = rawResponse
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')
      .replace(/<followup>[\s\S]*?<\/followup>/g, '')
      .replace(/<summary>[\s\S]*?<\/summary>/g, '')
      .replace(/<actionitems>[\s\S]*?<\/actionitems>/g, '')
      .replace(/<insights>[\s\S]*?<\/insights>/g, '')
      .trim();
    result.answer = cleanedResponse || rawResponse.trim();
  }

  // Extract <reasoning> section (for "Why I'm asking")
  const reasoningMatch = rawResponse.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
  if (reasoningMatch) {
    result.reasoning = reasoningMatch[1].trim();
  }

  // Extract <followup> section
  const followupMatch = rawResponse.match(/<followup>([\s\S]*?)<\/followup>/);
  if (followupMatch) {
    result.followUpQuestion = followupMatch[1].trim();
  }

  // Extract <summary> section
  const summaryMatch = rawResponse.match(/<summary>([\s\S]*?)<\/summary>/);
  if (summaryMatch) {
    result.isSummary = true;
    // Append summary to answer for display
    result.answer += '\n\n' + summaryMatch[1].trim();
  }

  // Extract <actionitems> section (JSON array)
  const actionItemsMatch = rawResponse.match(/<actionitems>([\s\S]*?)<\/actionitems>/);
  if (actionItemsMatch) {
    try {
      const rawJson = actionItemsMatch[1].trim();
      const items = JSON.parse(rawJson);
      if (Array.isArray(items)) {
        result.actionItems = items.map((item: { task: string; why: string; urgency: string }) => ({
          task: item.task || 'Unknown task',
          why: item.why || 'No explanation provided',
          urgency: (item.urgency === 'urgent' ? 'urgent' : 'routine') as 'routine' | 'urgent',
        }));
      }
    } catch {
      // Try to extract action items from non-JSON format
      const fallbackItems = parseActionItemsFallback(actionItemsMatch[1]);
      if (fallbackItems.length > 0) {
        result.actionItems = fallbackItems;
      }
    }
  }

  // Extract <insights> section (JSON array)
  const insightsMatch = rawResponse.match(/<insights>([\s\S]*?)<\/insights>/);
  if (insightsMatch) {
    try {
      const items = JSON.parse(insightsMatch[1].trim());
      if (Array.isArray(items)) {
        const validCategories: HealthCategory[] = ['sleep', 'energy', 'digestion', 'pain', 'mood', 'other'];
        result.insights = items
          .filter((item: { category: string; content: string }) =>
            validCategories.includes(item.category as HealthCategory)
          )
          .map((item: { category: string; content: string }) => ({
            category: item.category as HealthCategory,
            content: item.content,
          }));
      }
    } catch {
      // Silently ignore parse errors for insights
    }
  }

  // Check for red flags in the response
  const redFlagKeywords = [
    'seek immediate',
    'emergency',
    'call 911',
    'urgent evaluation',
    'go to the hospital',
    'seek prompt care immediately',
  ];
  result.isRedFlag = redFlagKeywords.some((keyword) =>
    rawResponse.toLowerCase().includes(keyword.toLowerCase())
  );

  return result;
}

/**
 * Fallback parser for action items that aren't in JSON format
 */
function parseActionItemsFallback(content: string): { task: string; why: string; urgency: 'routine' | 'urgent' }[] {
  const items: { task: string; why: string; urgency: 'routine' | 'urgent' }[] = [];

  // Try to parse line-by-line format like "- Task: ... Why: ... Urgency: ..."
  const lines = content.split('\n').filter(line => line.trim());
  for (const line of lines) {
    const trimmed = line.trim().replace(/^[-*•]\s*/, '');
    if (trimmed.length > 5) {
      // Check if it looks like an action item
      const isUrgent = trimmed.toLowerCase().includes('urgent');
      items.push({
        task: trimmed.split('-')[0]?.trim() || trimmed,
        why: 'Suggested by AI assistant',
        urgency: isUrgent ? 'urgent' : 'routine',
      });
    }
  }

  return items.slice(0, 5); // Limit to 5 items
}

/**
 * Extracts just the displayable content from the response (removes JSON sections)
 */
export function getDisplayContent(parsedResponse: ParsedAIResponse): string {
  let content = parsedResponse.answer;

  if (parsedResponse.followUpQuestion) {
    content += '\n\n' + parsedResponse.followUpQuestion;
  }

  return content;
}

/**
 * Builds a reasoning step from the parsed response
 */
export function buildReasoningStep(parsedResponse: ParsedAIResponse): {
  type: 'question_rationale' | 'analysis' | 'safety_flag';
  content: string;
} | null {
  if (parsedResponse.isRedFlag) {
    return {
      type: 'safety_flag',
      content: 'Safety concern detected. Please seek appropriate medical care.',
    };
  }

  if (parsedResponse.reasoning) {
    return {
      type: 'question_rationale',
      content: parsedResponse.reasoning,
    };
  }

  return null;
}
