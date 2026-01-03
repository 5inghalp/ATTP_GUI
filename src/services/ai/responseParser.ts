import type { ParsedAIResponse, HealthCategory } from '@/types';

/**
 * Parses the AI response that uses XML-like markers into structured components.
 */
export function parseAIResponse(rawResponse: string): ParsedAIResponse {
  // Debug logging - remove in production
  console.log('=== AI Response Parser Debug ===');
  console.log('Raw response length:', rawResponse.length);
  console.log('Raw response preview:', rawResponse.substring(0, 500) + '...');

  const result: ParsedAIResponse = {
    answer: '',
    isSummary: false,
    isRedFlag: false,
  };

  // Extract <answer> section
  const answerMatch = rawResponse.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerMatch) {
    result.answer = answerMatch[1].trim();
    console.log('Found <answer> tag');
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
    console.log('No <answer> tag found, using cleaned response');
  }

  // Extract <reasoning> section (for "Why I'm asking")
  const reasoningMatch = rawResponse.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
  if (reasoningMatch) {
    result.reasoning = reasoningMatch[1].trim();
    console.log('Found <reasoning> tag:', result.reasoning.substring(0, 100) + '...');
  }

  // Extract <followup> section
  const followupMatch = rawResponse.match(/<followup>([\s\S]*?)<\/followup>/);
  if (followupMatch) {
    result.followUpQuestion = followupMatch[1].trim();
    console.log('Found <followup> tag');
  }

  // Extract <summary> section
  const summaryMatch = rawResponse.match(/<summary>([\s\S]*?)<\/summary>/);
  if (summaryMatch) {
    result.isSummary = true;
    // Append summary to answer for display
    result.answer += '\n\n' + summaryMatch[1].trim();
    console.log('Found <summary> tag - this is a summary response');
  }

  // Extract <actionitems> section (JSON array)
  const actionItemsMatch = rawResponse.match(/<actionitems>([\s\S]*?)<\/actionitems>/);
  if (actionItemsMatch) {
    console.log('Found <actionitems> tag, content:', actionItemsMatch[1]);
    try {
      const rawJson = actionItemsMatch[1].trim();
      const items = JSON.parse(rawJson);
      if (Array.isArray(items)) {
        result.actionItems = items.map((item: { task: string; why: string; urgency: string }) => ({
          task: item.task || 'Unknown task',
          why: item.why || 'No explanation provided',
          urgency: (item.urgency === 'urgent' ? 'urgent' : 'routine') as 'routine' | 'urgent',
        }));
        console.log('Parsed action items:', result.actionItems.length);
      }
    } catch (e) {
      console.warn('Failed to parse action items JSON:', actionItemsMatch[1], e);
      // Try to extract action items from non-JSON format
      const fallbackItems = parseActionItemsFallback(actionItemsMatch[1]);
      if (fallbackItems.length > 0) {
        result.actionItems = fallbackItems;
        console.log('Used fallback parsing for action items:', fallbackItems.length);
      }
    }
  } else {
    console.log('No <actionitems> tag found');
  }

  // Extract <insights> section (JSON array)
  const insightsMatch = rawResponse.match(/<insights>([\s\S]*?)<\/insights>/);
  if (insightsMatch) {
    console.log('Found <insights> tag, content:', insightsMatch[1]);
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
        console.log('Parsed insights:', result.insights.length);
      }
    } catch (e) {
      console.warn('Failed to parse insights JSON:', insightsMatch[1], e);
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

  console.log('=== Parser Result ===');
  console.log('Has answer:', !!result.answer);
  console.log('Has reasoning:', !!result.reasoning);
  console.log('Has followup:', !!result.followUpQuestion);
  console.log('Is summary:', result.isSummary);
  console.log('Action items count:', result.actionItems?.length || 0);
  console.log('Insights count:', result.insights?.length || 0);
  console.log('Is red flag:', result.isRedFlag);

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
