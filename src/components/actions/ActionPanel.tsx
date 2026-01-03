import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ActionItem } from '@/types';

interface ActionPanelProps {
  items: ActionItem[];
  onToggleComplete: (itemId: string) => void;
}

export function ActionPanel({ items, onToggleComplete }: ActionPanelProps) {
  const completedCount = items.filter(i => i.completed).length;
  const urgentCount = items.filter(i => i.urgency === 'urgent' && !i.completed).length;

  return (
    <div className="flex flex-col h-full bg-card/50 rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                Next Steps
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {items.length > 0 ? `${completedCount}/${items.length} completed` : 'Suggested actions'}
              </p>
            </div>
          </div>
          {urgentCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-destructive/10 text-destructive font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              {urgentCount} urgent
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            items.map((item, index) => (
              <ActionItemCard
                key={item.id}
                item={item}
                index={index}
                onToggleComplete={() => onToggleComplete(item.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {items.length > 0 && (
        <div className="p-3 border-t border-border/30">
          <div className="flex items-center justify-center gap-2">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-12 h-12 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-muted-foreground/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Suggested next steps will appear here as we discuss your health.
      </p>
    </div>
  );
}

function ActionItemCard({
  item,
  index,
  onToggleComplete,
}: {
  item: ActionItem;
  index: number;
  onToggleComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`
        group rounded-xl border transition-organic overflow-hidden
        ${item.completed
          ? 'bg-secondary/20 border-border/30 opacity-60'
          : item.urgency === 'urgent'
            ? 'bg-destructive/[0.03] border-destructive/20 hover:border-destructive/30'
            : 'bg-card border-border/50 hover:border-primary/30 hover:shadow-sm'
        }
        opacity-0 animate-fade-in-up
      `}
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'forwards',
      }}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Custom checkbox */}
          <button
            onClick={onToggleComplete}
            className={`
              relative w-5 h-5 rounded-lg flex-shrink-0 mt-0.5 transition-organic
              ${item.completed
                ? 'bg-primary border-primary'
                : item.urgency === 'urgent'
                  ? 'border-2 border-destructive/40 hover:border-destructive/60'
                  : 'border-2 border-border hover:border-primary/50'
              }
            `}
          >
            {item.completed && (
              <svg className="w-3 h-3 text-primary-foreground absolute inset-0 m-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className={`text-sm leading-snug flex-1 ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.task}
              </p>
              {item.urgency === 'urgent' && !item.completed && (
                <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive font-semibold uppercase tracking-wide">
                  Urgent
                </span>
              )}
            </div>

            {/* Why button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className={`
                inline-flex items-center gap-1 mt-2 text-[11px] font-medium transition-organic
                ${item.completed
                  ? 'text-muted-foreground/60 hover:text-muted-foreground'
                  : 'text-primary/70 hover:text-primary'
                }
              `}
            >
              <svg
                className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              {expanded ? 'Hide reasoning' : 'Why this matters'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded reasoning */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="ml-8 p-2.5 rounded-lg bg-secondary/30 border-l-2 border-primary/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.why}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
