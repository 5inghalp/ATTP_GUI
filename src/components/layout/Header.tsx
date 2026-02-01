import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AppTab } from '@/types';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border/50 bg-gradient-to-r from-background via-secondary/20 to-background px-6 flex items-center justify-between relative">
      {/* Subtle decorative element */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-accent/[0.02]" />

      <div className="flex items-center gap-3 relative z-10">
        {/* Logo with organic shape */}
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm transition-organic hover:scale-105 hover:shadow-md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-primary-foreground"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
              <path d="m18 15-2-2" />
              <path d="m15 18-2-2" />
            </svg>
          </div>
          {/* Subtle pulse effect */}
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
        </div>

        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Restore Health
          </h1>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            AI Health Companion
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as AppTab)} className="relative z-10">
        <TabsList className="bg-secondary/50 backdrop-blur-sm border border-border/50 p-1 gap-1">
          <TabsTrigger
            value="chat"
            className="data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary px-4 py-2 rounded-lg transition-organic text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary px-4 py-2 rounded-lg transition-organic text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className="data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary px-4 py-2 rounded-lg transition-organic text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            Trends
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Right side decorative element */}
      <div className="w-32 relative z-10 flex justify-end">
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
      </div>
    </header>
  );
}
