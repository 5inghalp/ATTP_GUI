import type { Message, ChatSession, PatientProfile, HealthInsight } from '@/types';

// Client is now always "initialized" since API calls go through the server
// We keep this for backwards compatibility with the UI
let isServerConfigured = true;

export function initializeClient(_apiKey: string): void {
  // API key is now stored server-side via environment variable
  // This function is kept for backwards compatibility but is a no-op
  isServerConfigured = true;
}

export function isClientInitialized(): boolean {
  return isServerConfigured;
}

export interface StreamCallbacks {
  onText: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface ChatRequest {
  session: ChatSession;
  profile: PatientProfile | null;
  insights: HealthInsight[];
}

export async function streamMessage(
  request: ChatRequest,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    let fullText = '';

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              callbacks.onError(new Error(data.error));
              return;
            }

            if (data.done) {
              callbacks.onComplete(fullText);
              return;
            }

            if (data.text) {
              fullText += data.text;
              callbacks.onText(data.text);
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }

    callbacks.onComplete(fullText);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error('Unknown error occurred'));
  }
}

// Legacy function kept for backwards compatibility
export async function sendMessage(
  _systemPrompt: string,
  _messages: Message[]
): Promise<string> {
  throw new Error('Direct message sending is no longer supported. Use streamMessage with the API route.');
}
