import Anthropic from '@anthropic-ai/sdk';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { buildAIContext, getRelevantInsights } from '@/services/ai/contextBuilder';
import type { ChatSession, PatientProfile, HealthInsight } from '@/types';

export async function POST(request: Request) {
  try {
    // Validate authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: object) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: object) {
            cookieStore.delete(name);
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { session, profile, insights } = await request.json() as {
      session: ChatSession;
      profile: PatientProfile | null;
      insights: HealthInsight[];
    };

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured on server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Anthropic client
    const client = new Anthropic({ apiKey });

    // Get relevant insights (excluding current session)
    const relevantInsights = getRelevantInsights(insights, session.id);

    // Build context
    const context = buildAIContext(session, profile, relevantInsights);

    // Convert messages to Anthropic format
    const anthropicMessages = context.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Create streaming response
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: context.systemPrompt,
      messages: anthropicMessages,
    });

    // Create a ReadableStream to send back to the client
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text;
              // Send each chunk as a Server-Sent Event
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
