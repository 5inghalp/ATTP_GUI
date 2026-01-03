import { ScrollArea } from '@/components/ui/scroll-area';
import type { ReasoningStep } from '@/types';

interface ReasoningPanelProps {
  steps: ReasoningStep[];
  streamingText?: string;
}

export function ReasoningPanel({ steps, streamingText }: ReasoningPanelProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-reasoning rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-sm" style={{ fontFamily: 'var(--font-display)' }}>
              AI Reasoning
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Understanding why I ask
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {steps.length === 0 && !streamingText ? (
            <EmptyState />
          ) : (
            <>
              {steps.map((step, index) => (
                <ReasoningStepCard key={step.id} step={step} index={index} />
              ))}
              {streamingText && (
                <StreamingCard text={streamingText} />
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-12 h-12 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-muted-foreground/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="12" r="10" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        As we chat, I'll share my reasoning here to help you understand my questions.
      </p>
    </div>
  );
}

function StreamingCard({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden animate-fade-in-up">
      {/* Animated border gradient */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 animate-pulse" />
      <div className="relative m-[1px] p-3 bg-card/95 rounded-[11px] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-primary/70 font-medium mb-1">
              Thinking...
            </p>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              {text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReasoningStepCard({ step, index }: { step: ReasoningStep; index: number }) {
  const getStepConfig = () => {
    switch (step.type) {
      case 'safety_flag':
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          ),
          label: 'Important Notice',
          bgColor: 'bg-destructive/5',
          borderColor: 'border-destructive/30',
          iconBg: 'bg-destructive/10',
          iconColor: 'text-destructive',
          labelColor: 'text-destructive',
        };
      case 'question_rationale':
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          ),
          label: 'Why I\'m asking',
          bgColor: 'bg-primary/[0.03]',
          borderColor: 'border-primary/20',
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          labelColor: 'text-primary',
        };
      default:
        return {
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          ),
          label: 'Analysis',
          bgColor: 'bg-accent/[0.03]',
          borderColor: 'border-accent/20',
          iconBg: 'bg-accent/10',
          iconColor: 'text-accent',
          labelColor: 'text-accent',
        };
    }
  };

  const config = getStepConfig();

  return (
    <div
      className={`p-3 rounded-xl border transition-organic hover:shadow-sm ${config.bgColor} ${config.borderColor} opacity-0 animate-fade-in-up`}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'forwards',
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-6 h-6 rounded-lg ${config.iconBg} ${config.iconColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] uppercase tracking-wider font-medium mb-1.5 ${config.labelColor}`}>
            {config.label}
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed editorial-note pl-0 before:hidden">
            {step.content}
          </p>
          <p className="text-[9px] text-muted-foreground/60 mt-2">
            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}
