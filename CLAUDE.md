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

This is a React + TypeScript health exploration app built with **Next.js 15 (App Router)** that uses Claude AI via a server-side API route for conversational health guidance. Client state persists to localStorage.

### Core Data Flow

1. **User sends message** → `App.tsx` creates/selects a `ChatSession` and adds the user message
2. **AI request** → `sendHealthMessage()` calls `/api/chat` which streams from Claude server-side
3. **Response parsing** → XML-like markers (`<answer>`, `<reasoning>`, `<actionitems>`, `<insights>`) are parsed into structured data
4. **State update** → Parsed content updates session messages, action items, and global insights
5. **Persistence** → `AppContext` auto-saves to localStorage on state changes

### Key Modules

- **`src/app/`**: Next.js App Router structure
  - `layout.tsx`: Root layout with providers
  - `page.tsx`: Main page rendering `<App />`
  - `globals.css`: Global styles with Tailwind
  - `api/chat/route.ts`: Server-side API route for Claude AI streaming

- **`src/context/AppContext.tsx`**: Single source of truth. Manages `profile`, `sessions`, `insights`, active session, and UI flags. Hydrates from and persists to localStorage.

- **`src/services/ai/`**: AI integration pipeline
  - `claudeProvider.ts`: Anthropic SDK wrapper (now used by API route)
  - `systemPrompt.ts`: Builds the system prompt with patient profile, accumulated insights, and session state
  - `contextBuilder.ts`: Assembles system prompt + message history for API calls
  - `responseParser.ts`: Extracts structured data from XML-tagged AI responses
  - `aiService.ts`: Orchestrates client-side message flow, calls `/api/chat`

- **`src/types/index.ts`**: All domain types (`PatientProfile`, `ChatSession`, `Message`, `HealthInsight`, `ActionItem`, etc.)

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

### API Key Handling

The API key is configured server-side via the `ANTHROPIC_API_KEY` environment variable. For local development, create a `.env.local` file with your key. For production (Vercel), configure it in the environment variables settings.
