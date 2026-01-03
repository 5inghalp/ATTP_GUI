import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { initializeClient, isClientInitialized } from '@/services/ai/aiService';

const API_KEY_STORAGE_KEY = 'restore_health_anthropic_key';

interface ApiKeyInputProps {
  onKeySet: () => void;
}

export function ApiKeyInput({ onKeySet }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSet, setIsSet] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if key is already stored
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      initializeClient(storedKey);
      setIsSet(true);
      onKeySet();
    }
  }, [onKeySet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      setError('Invalid API key format. Anthropic keys start with "sk-ant-"');
      return;
    }

    // Store and initialize
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    initializeClient(apiKey);
    setIsSet(true);
    onKeySet();
  };

  const handleClear = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setIsSet(false);
  };

  if (isSet && isClientInitialized()) {
    return (
      <div className="flex items-center justify-center gap-3 py-2 px-4 bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-sm text-primary font-medium">Connected to Claude</span>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-organic underline-offset-2 hover:underline"
        >
          Change key
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="max-w-md mx-auto">
        <div className="card-organic bg-card rounded-2xl border border-border/50 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                  Connect to Claude
                </h3>
                <p className="text-xs text-muted-foreground">Enter your Anthropic API key to begin</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="font-mono text-sm rounded-xl border-border/50 bg-secondary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-organic"
                />
                {error && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m15 9-6 6" />
                      <path d="m9 9 6 6" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                  Your API key is stored locally and only used to communicate with Anthropic's API.
                </p>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-organic"
                >
                  Get your key at console.anthropic.com
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                </a>
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-organic hover:shadow-md py-5"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" x2="3" y1="12" y2="12" />
                </svg>
                Connect & Start
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
