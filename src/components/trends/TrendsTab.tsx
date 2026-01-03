import { useState } from 'react';
import type { HealthInsight, HealthCategory } from '@/types';

interface TrendsTabProps {
  insights: HealthInsight[];
}

const CATEGORY_CONFIG: Record<HealthCategory, { label: string; icon: React.ReactNode; gradient: string }> = {
  sleep: {
    label: 'Sleep',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
    gradient: 'from-indigo-500/20 to-purple-500/20',
  },
  energy: {
    label: 'Energy',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  digestion: {
    label: 'Digestion',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a9.96 9.96 0 0 0 7.07 2.93A9.96 9.96 0 0 1 12 22a9.96 9.96 0 0 1-7.07-2.93A9.96 9.96 0 0 0 12 2Z" />
      </svg>
    ),
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  pain: {
    label: 'Pain',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    gradient: 'from-rose-500/20 to-red-500/20',
  },
  mood: {
    label: 'Mood',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" x2="9.01" y1="9" y2="9" />
        <line x1="15" x2="15.01" y1="9" y2="9" />
      </svg>
    ),
    gradient: 'from-sky-500/20 to-blue-500/20',
  },
  other: {
    label: 'Other',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
    gradient: 'from-slate-500/20 to-gray-500/20',
  },
};

export function TrendsTab({ insights }: TrendsTabProps) {
  const [expandedCategory, setExpandedCategory] = useState<HealthCategory | null>(null);

  const insightsByCategory = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<HealthCategory, HealthInsight[]>);

  const categories = Object.keys(CATEGORY_CONFIG) as HealthCategory[];
  const totalInsights = insights.length;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
            <svg className="w-7 h-7 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>
              Health Trends
            </h2>
            <p className="text-muted-foreground text-sm">
              Insights synthesized from your conversations
            </p>
          </div>
        </div>

        {totalInsights > 0 && (
          <div className="text-right">
            <p className="text-3xl font-medium text-primary" style={{ fontFamily: 'var(--font-display)' }}>
              {totalInsights}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Insights
            </p>
          </div>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category, index) => {
          const config = CATEGORY_CONFIG[category];
          const categoryInsights = insightsByCategory[category] || [];
          const isExpanded = expandedCategory === category;

          return (
            <CategoryCard
              key={category}
              config={config}
              insights={categoryInsights}
              isExpanded={isExpanded}
              onToggle={() => setExpandedCategory(isExpanded ? null : category)}
              index={index}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {insights.length === 0 && (
        <div className="text-center py-16 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="w-16 h-16 rounded-3xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            No insights yet
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Start chatting about your health to build your trends. Insights will appear here as patterns emerge.
          </p>
        </div>
      )}
    </div>
  );
}

function CategoryCard({
  config,
  insights,
  isExpanded,
  onToggle,
  index,
}: {
  config: { label: string; icon: React.ReactNode; gradient: string };
  insights: HealthInsight[];
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const hasInsights = insights.length > 0;

  return (
    <div
      className={`
        rounded-2xl border transition-organic overflow-hidden cursor-pointer
        ${hasInsights
          ? 'bg-card border-border/50 hover:border-primary/30 hover:shadow-md card-organic'
          : 'bg-secondary/20 border-border/30 hover:bg-secondary/30'
        }
        ${isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}
        opacity-0 animate-fade-in-up
      `}
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'forwards',
      }}
      onClick={hasInsights ? onToggle : undefined}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-foreground/70`}>
              {config.icon}
            </div>
            <div>
              <h3 className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                {config.label}
              </h3>
              <p className="text-xs text-muted-foreground">
                {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
              </p>
            </div>
          </div>

          {hasInsights && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-2xl font-medium text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {insights.length}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}
        </div>

        {/* Preview insights when not expanded */}
        {hasInsights && !isExpanded && (
          <div className="mt-4 space-y-1.5">
            {insights.slice(0, 2).map((insight) => (
              <p key={insight.id} className="text-xs text-muted-foreground truncate flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />
                {insight.content}
              </p>
            ))}
            {insights.length > 2 && (
              <p className="text-xs text-primary/70 font-medium">
                +{insights.length - 2} more
              </p>
            )}
          </div>
        )}

        {/* Expanded view */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
            {insights.map((insight, i) => (
              <div
                key={insight.id}
                className="p-3 rounded-xl bg-secondary/30 border border-border/30"
                style={{
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <p className="text-sm text-foreground leading-relaxed">
                  {insight.content}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(insight.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
