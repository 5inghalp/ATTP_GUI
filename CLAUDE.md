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

This is a React + TypeScript health exploration app built with **Next.js 15 (App Router)** that uses Claude AI via a server-side API route for conversational health guidance. User authentication and data persistence is handled by **Supabase** (Auth + PostgreSQL).

### Core Data Flow

1. **User authenticates** → Supabase Auth handles login/signup via email or OAuth
2. **User sends message** → `App.tsx` creates/selects a `ChatSession` and adds the user message
3. **AI request** → `sendHealthMessage()` calls `/api/chat` (validates auth) which streams from Claude server-side
4. **Response parsing** → XML-like markers (`<answer>`, `<reasoning>`, `<actionitems>`, `<insights>`) are parsed into structured data
5. **State update** → Parsed content updates session messages, action items, and global insights
6. **Persistence** → `AppContext` saves to Supabase (optimistic updates with real IDs)

### Key Modules

- **`src/app/`**: Next.js App Router structure
  - `layout.tsx`: Root layout with AuthProvider and AppProvider
  - `page.tsx`: Main page rendering `<App />`
  - `globals.css`: Global styles with Tailwind
  - `api/chat/route.ts`: Server-side API route for Claude AI streaming (auth protected)
  - `auth/login/page.tsx`: Login page
  - `auth/signup/page.tsx`: Signup page
  - `auth/callback/route.ts`: OAuth callback handler

- **`src/middleware.ts`**: Route protection - redirects unauthenticated users to login

- **`src/lib/supabase.ts`**: Supabase client configuration (browser and server clients)

- **`src/context/AuthContext.tsx`**: Auth state management (user, signOut)

- **`src/context/AppContext.tsx`**: Single source of truth. Manages `profile`, `sessions`, `insights`, active session, and UI flags. Fetches from and persists to Supabase.

- **`src/services/db.ts`**: Database operations - CRUD for profiles, sessions, messages, action items, insights

- **`src/services/storage.ts`**: Legacy localStorage wrapper (used for migration)

- **`src/services/ai/`**: AI integration pipeline
  - `claudeProvider.ts`: Anthropic SDK wrapper (now used by API route)
  - `systemPrompt.ts`: Builds the system prompt with patient profile, accumulated insights, and session state
  - `contextBuilder.ts`: Assembles system prompt + message history for API calls
  - `responseParser.ts`: Extracts structured data from XML-tagged AI responses
  - `aiService.ts`: Orchestrates client-side message flow, calls `/api/chat`

- **`src/types/index.ts`**: All domain types (`User`, `PatientProfile`, `ChatSession`, `Message`, `HealthInsight`, `ActionItem`, etc.)
- **`src/types/database.ts`**: Supabase database types

### Layout Structure

`AppShell` defines three tabs (chat, profile, trends):
- **Chat tab**: 3-column layout with SessionList (left), ChatArea (center), ReasoningPanel + ActionPanel (right)
- **Profile tab**: Patient profile editor
- **Trends tab**: Health insights visualization by category

### AI Response Format

The system prompt instructs Claude to use XML markers:
```
<answer>Main response</answer>
<reasoning>Why I'm asking this follow-up</reasoning>
<followup>Single follow-up question</followup>
<summary>Final summary when concluding</summary>
<actionitems>[{"task":"...", "why":"...", "urgency":"routine|urgent"}]</actionitems>
<insights>[{"category":"sleep|energy|digestion|pain|mood|other", "content":"..."}]</insights>
```

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Environment Variables

Required environment variables (add to `.env.local` for development, Vercel for production):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

### Database Setup

Run `supabase-schema.sql` in your Supabase SQL Editor to create the required tables and policies. The schema includes:
- `profiles` - User profile data (extends auth.users)
- `medications`, `conditions`, `allergies` - Health data
- `chat_sessions`, `messages`, `action_items` - Conversation data
- `health_insights` - Extracted health insights
- Row Level Security (RLS) policies for data isolation
- Auto-create profile trigger on signup
