# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Next.js dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

**Note:** No test framework is configured yet. To add tests, set up Vitest and add `test`/`test:watch` scripts.

## Architecture Overview

This is a React + TypeScript health exploration app built with **Next.js 16 (App Router)** that uses Claude AI via a server-side API route for conversational health guidance. User authentication and data persistence is handled by **Supabase** (Auth + PostgreSQL).

### Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI primitives
- **Auth & Database**: Supabase (Auth + PostgreSQL)
- **AI**: Anthropic Claude API (claude-sonnet-4)

### Core Data Flow

1. **User authenticates** → Supabase Auth handles login/signup via email or OAuth
2. **User sends message** → `App.tsx` creates/selects a `ChatSession` and adds the user message
3. **AI request** → `sendHealthMessage()` calls `/api/chat` (validates auth) which streams from Claude server-side
4. **Response parsing** → XML-like markers (`<answer>`, `<reasoning>`, `<actionitems>`, `<insights>`) are parsed into structured data
5. **State update** → Parsed content updates session messages, action items, and global insights
6. **Persistence** → `AppContext` saves to Supabase (optimistic updates with real IDs)

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with AuthProvider + AppProvider
│   ├── page.tsx                  # Main page rendering <App />
│   ├── globals.css               # Global styles with Tailwind
│   ├── api/chat/route.ts         # Claude AI streaming endpoint (auth protected)
│   └── auth/
│       ├── login/page.tsx        # Login page (email + OAuth)
│       ├── signup/page.tsx       # Signup page with email confirmation
│       └── callback/route.ts     # OAuth callback handler
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          # Main 3-column layout
│   │   └── Header.tsx            # Header with tabs + user menu
│   ├── chat/
│   │   ├── ChatArea.tsx          # Message display + input
│   │   └── SessionList.tsx       # Conversation sidebar
│   ├── profile/ProfileTab.tsx    # Health profile editor
│   ├── trends/TrendsTab.tsx      # Health insights visualization
│   ├── reasoning/ReasoningPanel.tsx
│   ├── actions/ActionPanel.tsx
│   ├── MigrationPrompt.tsx       # localStorage import modal
│   └── ui/                       # Radix UI primitives
├── context/
│   ├── AuthContext.tsx           # Auth state (user, signOut)
│   └── AppContext.tsx            # App state (profile, sessions, insights)
├── services/
│   ├── db.ts                     # Supabase CRUD operations
│   ├── storage.ts                # Legacy localStorage (for migration)
│   └── ai/
│       ├── aiService.ts          # Message orchestration
│       ├── contextBuilder.ts     # System prompt assembly
│       ├── responseParser.ts     # XML response parsing
│       └── systemPrompt.ts       # System prompt template
├── lib/
│   └── supabase.ts               # Supabase client (browser + server)
├── types/
│   ├── index.ts                  # Domain types
│   └── database.ts               # Supabase DB types
├── middleware.ts                 # Route protection
└── App.tsx                       # Main client component
```

## Authentication Flow

1. **Unauthenticated users** → Middleware redirects to `/auth/login`
2. **Login options**: Email/password or OAuth (Google, GitHub)
3. **Email signup** → Confirmation email sent (check spam folder)
4. **After auth** → User redirected to main app, data loads from Supabase
5. **First login** → If localStorage data exists, migration prompt appears

### Configuring OAuth Providers

In Supabase Dashboard → Authentication → Providers:
1. Enable Google/GitHub
2. Add redirect URL: `https://your-domain.com/auth/callback`

## Layout Structure

`AppShell` defines three tabs (chat, profile, trends):
- **Chat tab**: 3-column layout with SessionList (left), ChatArea (center), ReasoningPanel + ActionPanel (right)
- **Profile tab**: Patient profile editor (name, age, medications, conditions, allergies)
- **Trends tab**: Health insights visualization grouped by category

## AI Response Format

The system prompt instructs Claude to use XML markers:
```xml
<answer>Main response</answer>
<reasoning>Why I'm asking this follow-up</reasoning>
<followup>Single follow-up question</followup>
<summary>Final summary when concluding</summary>
<actionitems>[{"task":"...", "why":"...", "urgency":"routine|urgent"}]</actionitems>
<insights>[{"category":"sleep|energy|digestion|pain|mood|other", "content":"..."}]</insights>
```

## Environment Variables

Required environment variables (add to `.env.local` for development, Vercel for production):

```bash
# Supabase - get from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx

# Anthropic - get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...
```

See `.env.local.example` for a template.

## Database Setup

Run `supabase-schema.sql` in your Supabase SQL Editor to create:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (extends auth.users) |
| `medications` | User medications with dosage |
| `conditions` | Health conditions |
| `allergies` | Known allergies |
| `chat_sessions` | Conversation metadata |
| `messages` | Chat messages with reasoning |
| `action_items` | Tasks extracted from conversations |
| `health_insights` | Insights categorized by health area |

All tables have Row Level Security (RLS) - users can only access their own data.

## Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Troubleshooting

- **Confirmation email in spam**: Supabase emails often land in spam. For dev, disable email confirmation in Supabase Dashboard → Authentication → Providers → Email
- **Port in use**: Kill existing process with `lsof -ti:3000 | xargs kill`
- **Middleware deprecation warning**: Safe to ignore for now (Next.js 16 migration to "proxy")
