import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@/types';

// Note: For production, API calls should go through a backend proxy
// This client-side implementation is for MVP/demo purposes only

let client: Anthropic | null = null;

export function initializeClient(apiKey: string): void {
  client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true, // Required for client-side usage - move to backend for production
  });
}

export function isClientInitialized(): boolean {
  return client !== null;
}

export interface StreamCallbacks {
  onText: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamMessage(
  systemPrompt: string,
  messages: Message[],
  callbacks: StreamCallbacks
): Promise<void> {
  if (!client) {
    callbacks.onError(new Error('Claude client not initialized. Please enter your API key.'));
    return;
  }

  // Convert our message format to Anthropic's format
  const anthropicMessages = messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  try {
    let fullText = '';

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullText += text;
        callbacks.onText(text);
      }
    }

    callbacks.onComplete(fullText);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error('Unknown error occurred'));
  }
}

export async function sendMessage(
  systemPrompt: string,
  messages: Message[]
): Promise<string> {
  if (!client) {
    throw new Error('Claude client not initialized. Please enter your API key.');
  }

  // Convert our message format to Anthropic's format
  const anthropicMessages = messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === 'text');
  return textContent?.type === 'text' ? textContent.text : '';
}
