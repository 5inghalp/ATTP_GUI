import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '@/types';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export function ChatArea({ messages, onSendMessage, isLoading }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      onSendMessage(suggestion);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-wellness">
      <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        <div className="px-6 py-4">
          <div className="space-y-6 max-w-2xl mx-auto">
            {messages.length === 0 ? (
              <WelcomeMessage onSuggestionClick={handleSuggestionClick} isLoading={isLoading} />
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLatest={index === messages.length - 1}
                />
              ))
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <ThinkingIndicator />
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you're experiencing..."
              className="min-h-[80px] max-h-[200px] resize-none pr-24 rounded-2xl border-border/50 bg-background/80 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-organic text-[15px] leading-relaxed"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute bottom-3 right-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-organic hover:shadow-md disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              Send
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}

interface WelcomeMessageProps {
  onSuggestionClick: (suggestion: string) => void;
  isLoading?: boolean;
}

function WelcomeMessage({ onSuggestionClick, isLoading }: WelcomeMessageProps) {
  const suggestions = [
    "I've been feeling tired lately",
    "I'm having trouble sleeping",
    "My energy levels are low"
  ];

  return (
    <div className="text-center py-16 px-4 animate-fade-in-up">
      {/* Decorative element */}
      <div className="relative inline-block mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </div>
      </div>

      <h2 className="text-3xl font-semibold mb-3 text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
        Welcome to Restore Health
      </h2>
      <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed mb-8">
        Share what's on your mind, and I'll help you explore potential factors
        through thoughtful questions and insights.
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-organic disabled:opacity-50 disabled:cursor-not-allowed opacity-0 animate-fade-in-up stagger-${i + 1}`}
            style={{ animationFillMode: 'forwards' }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, isLatest }: { message: Message; isLatest: boolean }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isLatest ? 'animate-fade-in-up' : ''}`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar for assistant */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Restore Health</span>
          </div>
        )}

        <div
          className={`p-4 ${
            isUser
              ? 'bubble-user text-primary-foreground'
              : 'bubble-assistant card-organic'
          }`}
        >
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
        </div>

        <p className={`text-[10px] text-muted-foreground mt-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-breathe">
          <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-secondary/50 border border-border/50">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="ml-2 text-sm text-muted-foreground italic">Thinking...</span>
        </div>
      </div>
    </div>
  );
}
