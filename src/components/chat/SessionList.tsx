import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatSession } from '@/types';

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
}: SessionListProps) {
  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Button
          onClick={onNewSession}
          className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-organic hover:shadow-md group"
        >
          <svg className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {sessions.length === 0 ? (
            <EmptyState />
          ) : (
            sessions.map((session, index) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                onClick={() => onSelectSession(session.id)}
                index={index}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground text-center">
          {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        No conversations yet.
        <br />
        Start a new one to begin.
      </p>
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  onClick,
  index,
}: {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  const messageCount = session.messages.length;
  const hasMessages = messageCount > 0;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-xl transition-organic
        ${isActive
          ? 'bg-primary/10 border border-primary/20 shadow-sm'
          : 'hover:bg-secondary/50 border border-transparent'
        }
        opacity-0 animate-fade-in-up
      `}
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'forwards',
      }}
    >
      <div className="flex items-start gap-3 overflow-hidden">
        {/* Session indicator */}
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
          ${isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary/50 text-muted-foreground'
          }
        `}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </div>

        <div style={{ width: '160px' }}>
          <p
            className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {session.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">
              {new Date(session.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {hasMessages && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <span className="text-[10px] text-muted-foreground">
                  {messageCount} message{messageCount !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>

          {/* Progress indicator for questions */}
          {session.questionCount > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((session.questionCount / 10) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">
                {session.questionCount}/10
              </span>
            </div>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex flex-col items-end gap-1">
          {session.hasRedFlag && (
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          )}
          {session.isSummaryMode && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium">
              Complete
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
