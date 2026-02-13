'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export function MigrationPrompt() {
  const { hasPendingMigration, migrateLocalData, skipMigration } = useApp();
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasPendingMigration) return null;

  const handleMigrate = async () => {
    setIsMigrating(true);
    setError(null);
    try {
      await migrateLocalData();
    } catch (err) {
      setError('Failed to import data. Please try again.');
      console.error(err);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Import Existing Data</h2>
        </div>

        <p className="text-muted-foreground mb-4">
          We found existing conversations and health data stored on this device.
          Would you like to import it to your new account?
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={skipMigration}
            disabled={isMigrating}
            className="flex-1 py-2.5 px-4 rounded-lg border border-border text-foreground font-medium hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Start Fresh
          </button>
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isMigrating ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
