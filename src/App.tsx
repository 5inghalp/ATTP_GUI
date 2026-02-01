'use client'

import { useCallback, useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SessionList } from '@/components/chat/SessionList';
import { ChatArea } from '@/components/chat/ChatArea';
import { ReasoningPanel } from '@/components/reasoning/ReasoningPanel';
import { ActionPanel } from '@/components/actions/ActionPanel';
import { ProfileTab } from '@/components/profile/ProfileTab';
import { TrendsTab } from '@/components/trends/TrendsTab';
import { useApp } from '@/context/AppContext';
import { sendHealthMessage } from '@/services/ai/aiService';
import type { ReasoningStep, ChatSession, Message } from '@/types';

function App() {
  const {
    profile,
    sessions,
    insights,
    activeSessionId,
    activeSession,
    isLoading,
    streamingReasoning,
    updateProfile,
    createSession,
    selectSession,
    addMessage,
    addActionItems,
    addInsights,
    toggleActionItem,
    updateSessionFields,
    setIsLoading,
    setStreamingReasoning,
  } = useApp();

  const [streamingContent, setStreamingContent] = useState('');

  // Use refs to track latest state for use in async callbacks
  const sessionsRef = useRef(sessions);
  const profileRef = useRef(profile);
  const insightsRef = useRef(insights);

  // Keep refs in sync with state
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    insightsRef.current = insights;
  }, [insights]);

  // Send message to AI
  const handleSendMessage = useCallback(
    async (content: string) => {
      console.log('=== handleSendMessage called ===');
      console.log('Content:', content);
      console.log('Current activeSessionId:', activeSessionId);

      let sessionId = activeSessionId;
      let currentSession: ChatSession | null = activeSession;

      // Create new session if none exists
      if (!sessionId) {
        console.log('Creating new session...');
        currentSession = createSession(content.slice(0, 50) + (content.length > 50 ? '...' : ''));
        sessionId = currentSession.id;
        console.log('New session created:', sessionId);
      } else {
        // Get the current session from state
        currentSession = sessions.find(s => s.id === sessionId) || activeSession;
        console.log('Using existing session, messages count:', currentSession?.messages.length);
      }

      // Create the user message
      const userMessage: Message = {
        id: Math.random().toString(36).substring(2, 15),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      // Build the session with the new message BEFORE calling addMessage
      // This ensures we have the complete message history for the AI
      const sessionForAI: ChatSession = {
        ...currentSession!,
        messages: [...(currentSession?.messages || []), userMessage],
      };

      console.log('Session for AI - messages count:', sessionForAI.messages.length);
      console.log('Messages:', sessionForAI.messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) })));

      // Add user message to state (for UI display)
      addMessage(sessionId, {
        role: 'user',
        content,
      });

      // Start loading
      setIsLoading(true);
      setStreamingContent('');
      setStreamingReasoning('');

      // Send to AI with the pre-built session (not relying on state updates)
      try {
        await sendHealthMessage(sessionForAI, profileRef.current, insightsRef.current, {
          onStreamingText: (text) => {
            setStreamingContent((prev) => prev + text);
          },
          onReasoningUpdate: (reasoning) => {
            setStreamingReasoning(reasoning);
          },
          onComplete: (result) => {
            console.log('=== AI Response Complete ===');
            console.log('SessionId:', sessionId);
            console.log('Display content length:', result.displayContent.length);
            console.log('Display content preview:', result.displayContent.substring(0, 200));
            console.log('Action items:', result.actionItems.length);
            console.log('Insights:', result.insights.length);
            console.log('Current sessions:', sessionsRef.current.map(s => ({ id: s.id, msgCount: s.messages.length })));

            // Check for empty/interrupted response
            if (!result.displayContent || result.displayContent.trim() === '') {
              console.log('Empty response detected, adding error message');
              addMessage(sessionId, {
                role: 'assistant',
                content: 'I apologize, but my response was interrupted. This can happen if a browser extension is interfering with the connection. Please try again.',
              });
              setIsLoading(false);
              setStreamingContent('');
              setStreamingReasoning('');
              return;
            }

            // Add the AI message
            console.log('Adding AI message to session:', sessionId);
            const addedMessage = addMessage(sessionId, {
              role: 'assistant',
              content: result.displayContent,
              reasoning: result.reasoning ? [result.reasoning] : undefined,
            });
            console.log('Message added:', addedMessage);

            // Add action items if any
            if (result.actionItems.length > 0) {
              console.log('Adding action items:', result.actionItems);
              addActionItems(sessionId, result.actionItems);
            }

            // Add insights if any
            if (result.insights.length > 0) {
              console.log('Adding insights:', result.insights);
              addInsights(
                result.insights.map((insight) => ({
                  ...insight,
                  sourceSessionId: sessionId,
                }))
              );
            }

            // Update session metadata using functional update (preserves messages)
            updateSessionFields(sessionId, {
              questionCount: (sessionsRef.current.find(s => s.id === sessionId)?.questionCount || 0) + 1,
              isSummaryMode: result.isSummary,
              hasRedFlag: result.isRedFlag,
            });

            setIsLoading(false);
            setStreamingContent('');
            setStreamingReasoning('');
          },
          onError: (error) => {
            console.error('AI Error:', error);
            // Add error message
            addMessage(sessionId, {
              role: 'assistant',
              content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
            });
            setIsLoading(false);
            setStreamingContent('');
            setStreamingReasoning('');
          },
        });
      } catch (error) {
        console.error('Error sending message:', error);
        // Show error message to user instead of silent failure
        addMessage(sessionId, {
          role: 'assistant',
          content: `I encountered an error while processing your message. This may be caused by a browser extension interfering with the connection. Please try again, or try disabling browser extensions. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        setIsLoading(false);
        setStreamingContent('');
        setStreamingReasoning('');
      }
    },
    [activeSessionId, activeSession, sessions, createSession, addMessage, addActionItems, addInsights, updateSessionFields, setIsLoading, setStreamingReasoning]
  );

  // Toggle action item completion
  const handleToggleActionComplete = useCallback(
    (itemId: string) => {
      if (activeSessionId) {
        toggleActionItem(activeSessionId, itemId);
      }
    },
    [activeSessionId, toggleActionItem]
  );

  // Get all reasoning steps from current session's messages
  const currentReasoningSteps: ReasoningStep[] =
    activeSession?.messages.flatMap((m) => m.reasoning || []) || [];

  // Combine stored messages with streaming content for display
  const displayMessages = activeSession?.messages || [];
  const messagesWithStreaming = isLoading && streamingContent
    ? [
        ...displayMessages,
        {
          id: 'streaming',
          role: 'assistant' as const,
          content: streamingContent,
          timestamp: new Date().toISOString(),
        },
      ]
    : displayMessages;

  return (
    <AppShell
      sessionList={
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={selectSession}
          onNewSession={() => createSession()}
        />
      }
      chatArea={
        <ChatArea
          messages={messagesWithStreaming}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      }
      reasoningPanel={
        <ReasoningPanel steps={currentReasoningSteps} streamingText={streamingReasoning} />
      }
      actionPanel={
        <ActionPanel
          items={activeSession?.actionItems || []}
          onToggleComplete={handleToggleActionComplete}
        />
      }
      profileTab={<ProfileTab profile={profile} onUpdateProfile={updateProfile} />}
      trendsTab={<TrendsTab insights={insights} />}
    />
  );
}

export default App;
