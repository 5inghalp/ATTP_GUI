import { useState } from 'react';
import { Header } from './Header';
import type { AppTab } from '@/types';

interface AppShellProps {
  sessionList: React.ReactNode;
  chatArea: React.ReactNode;
  reasoningPanel: React.ReactNode;
  actionPanel: React.ReactNode;
  profileTab: React.ReactNode;
  trendsTab: React.ReactNode;
}

export function AppShell({
  sessionList,
  chatArea,
  reasoningPanel,
  actionPanel,
  profileTab,
  trendsTab,
}: AppShellProps) {
  const [activeTab, setActiveTab] = useState<AppTab>('chat');

  return (
    <div className="h-screen flex flex-col bg-background relative">
      {/* Grain overlay for editorial texture */}
      <div className="grain-overlay" />

      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-hidden relative z-10">
        {/* Chat Tab */}
        <div
          className={`h-full transition-organic ${
            activeTab === 'chat' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
          }`}
        >
          <div className="h-full flex">
            {/* Left Column - Sessions List */}
            <aside className="w-72 border-r border-border/50 bg-sidebar flex flex-col shadow-sm">
              {sessionList}
            </aside>

            {/* Center Column - Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {chatArea}
            </div>

            {/* Right Column - Reasoning & Actions */}
            <aside className="w-80 border-l border-border/50 bg-sidebar/50 flex flex-col p-3 gap-3">
              {/* Top - Reasoning Panel */}
              <div className="flex-1 overflow-hidden min-h-0">
                {reasoningPanel}
              </div>
              {/* Bottom - Action Panel */}
              <div className="h-72 flex-shrink-0 overflow-hidden">
                {actionPanel}
              </div>
            </aside>
          </div>
        </div>

        {/* Profile Tab */}
        <div
          className={`h-full transition-organic ${
            activeTab === 'profile' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
          }`}
        >
          <div className="h-full overflow-auto bg-gradient-wellness">
            {profileTab}
          </div>
        </div>

        {/* Trends Tab */}
        <div
          className={`h-full transition-organic ${
            activeTab === 'trends' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
          }`}
        >
          <div className="h-full overflow-auto bg-gradient-wellness">
            {trendsTab}
          </div>
        </div>
      </main>
    </div>
  );
}
