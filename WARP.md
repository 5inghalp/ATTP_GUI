# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

This is a React + TypeScript app built with **Next.js 15 (App Router)**.

Use your preferred Node package manager (examples below use `npm`).

- **Install dependencies** (once per environment):
  - `npm install`
- **Run the dev server** (Next.js with hot reload):
  - `npm run dev`
- **Build for production**:
  - `npm run build`
- **Start production server**:
  - `npm run start`
- **Run linting**:
  - `npm run lint`

### Tests

There is currently **no test runner or `test` script configured** in `package.json`. Before adding tests, set up a framework (e.g., Vitest) and add appropriate `test` / `test:watch` scripts; until then there is no command available to run a single test.

## Tooling and configuration

- **Next.js config**: `next.config.ts`
- **TypeScript config**: `tsconfig.json`
  - Path alias `@/*` maps to `./src/*`
- **PostCSS config**: `postcss.config.mjs`
  - Configured with Tailwind CSS
- **ESLint**: `eslint.config.js`
  - Flat config using recommended TypeScript and React rules
- **Styling**:
  - Tailwind CSS v4
  - Global styles in `src/app/globals.css`
  - Reusable UI primitives in `src/components/ui/`

## High-level application architecture

### Entry point and shell

- **`src/app/layout.tsx`**
  - Root layout wrapping the app with `<AppProvider />` (global state/context provider)
- **`src/app/page.tsx`**
  - Main page rendering `<App />` component
- **`src/App.tsx`**
  - Central orchestrator of the UI
  - Pulls global state and actions from `useApp()` (profile, sessions, insights, active session, loading flags, etc.)
  - Manages transient UI state for **streaming assistant content** (`streamingContent`) and **streaming reasoning text** via callbacks
  - Handles the **end-to-end AI message flow**:
    - Ensures there is an active `ChatSession` (creates one if needed, seeding the title from the first user message)
    - Adds the user message to the session immediately for UI display
    - Calls `sendHealthMessage(sessionForAI, profileRef.current, insightsRef.current, callbacks)` from `src/services/ai/aiService.ts`
    - Provides callbacks that:
      - Append streaming text to `streamingContent`
      - Update `streamingReasoning` for the reasoning panel
      - On completion, add the assistant message (parsed display content + optional reasoning step) to the session, attach parsed action items, attach parsed insights, and update lightweight session metadata (`questionCount`, `isSummaryMode`, `hasRedFlag`)
      - On error, surface an assistant message explaining the failure
  - Uses refs (`sessionsRef`, `profileRef`, `insightsRef`) to keep async callbacks in sync with the latest state and avoid stale closures
  - Composes the main layout by passing React nodes into `AppShell`:
    - `sessionList` → `<SessionList />`
    - `chatArea` → `<ChatArea />`
    - `reasoningPanel` → `<ReasoningPanel />`
    - `actionPanel` → `<ActionPanel />`
    - `profileTab` → `<ProfileTab />`
    - `trendsTab` → `<TrendsTab />`

### Layout and tabs

- **`src/components/layout/AppShell.tsx`**
  - Defines the **three main tabs**: `chat`, `profile`, `trends`
  - Owns a local `activeTab` state (type `AppTab`) and shows one of three full-screen views:
    - **Chat tab**: Three-column layout
      - Left: `SessionList` (conversation list and selector)
      - Center: `ChatArea` (message list + composer)
      - Right: `ReasoningPanel` ("why I'm asking" style reasoning) + `ActionPanel` (next-step tasks)
    - **Profile tab**: Scrollable view hosting `ProfileTab`
    - **Trends tab**: Scrollable view hosting `TrendsTab`
- **`src/components/layout/Header.tsx`**
  - Top bar with app branding and a `Tabs` control (from `components/ui/tabs`) for switching between `chat`, `profile`, and `trends`
  - Uses `AppTab` values and delegates tab changes back to `AppShell` via `onTabChange`

### Global state and persistence

- **`src/context/AppContext.tsx`**
  - Single **source of truth** for application state via React context:
    - `profile: PatientProfile | null`
    - `sessions: ChatSession[]` (each includes messages, action items, counters, flags)
    - `insights: HealthInsight[]`
    - `activeSessionId: string | null`
    - `activeTab: AppTab` (currently not wired into `AppShell`, which keeps its own tab state)
    - `isLoading`, `streamingReasoning` (UI/connection flags)
    - Derived `activeSession` computed from `sessions` + `activeSessionId`
  - On initialization, **hydrates state from localStorage** via `storage` helpers
  - Persists changes back to localStorage using `useEffect` watches on `profile`, `sessions`, and `insights`
  - Exposes a rich set of actions:
    - Profile: `updateProfile`
    - Sessions: `createSession`, `selectSession`, `deleteSession` (also prunes related insights), `updateSession`, `updateSessionFields` (updates selected fields and `updatedAt`)
    - Messages: `addMessage` (generates id/timestamp, appends, updates `updatedAt`, and auto-derives a title from the first user message when the default title is still "New Conversation")
    - Action items: `addActionItems` (bulk attach to a session) and `toggleActionItem`
    - Insights: `addInsights` (wraps plain insights with ids and timestamps, then prepends them to the list)
    - UI flags: `setActiveTab`, `setIsLoading`, `setStreamingReasoning`
  - `useApp()` is the public hook; it throws if used outside `AppProvider`
- **`src/services/storage.ts`**
  - Thin abstraction over `localStorage` with JSON parsing/stringifying and basic error handling
  - Uses fixed keys:
    - Profile → `restore_health_profile`
    - Sessions → `restore_health_sessions`
    - Insights → `restore_health_insights`
  - Exposes grouped operations via a `storage` object used by `AppContext`:
    - `storage.profile`: `get`, `save`, `clear`
    - `storage.sessions`: `getAll`, `saveAll`, `save`, `delete`
    - `storage.insights`: `getAll`, `saveAll`, `add`, `addMany`, `deleteBySession`
    - `storage.clearAll()` to wipe all app data

### Hooks and derived data

- **`src/hooks/useSessions.ts`**
  - Convenience wrapper over `useApp()` exposing session-oriented operations
  - Adds helpers `incrementQuestionCount`, `setSummaryMode`, and `setRedFlag` that mutate the active session via `updateSession`
- **`src/hooks/useProfile.ts`**
  - Encapsulates profile creation and updates:
    - `initializeProfile` constructs a complete `PatientProfile` with a generated id and defaulted arrays, then saves it via `updateProfile`
    - Provides granular mutators: `updateBasicInfo`, `add/removeMedication`, `add/removeCondition`, `add/removeAllergy`
- **`src/hooks/useInsights.ts`**
  - Exposes insights and helper selectors:
    - `insightsByCategory` (memoized map from `HealthCategory` to `HealthInsight[]`)
    - `getInsightsByCategory`, `getInsightsBySession`, `getCategoryCount`
    - `totalInsights` count
  - Re-exports `addInsights` from context, so callers can append new insights

### AI integration pipeline

The AI flow uses a **server-side API route** for secure API key handling:

- **`src/app/api/chat/route.ts`**
  - Server-side API route that handles Claude AI requests
  - Reads `ANTHROPIC_API_KEY` from environment variables
  - Creates Anthropic client and streams responses via SSE (Server-Sent Events)
  - Returns streaming text chunks to the client

- **`src/services/ai/aiService.ts`**
  - Orchestrates client-side message flow
  - `sendHealthMessage(session, profile, allInsights, callbacks)`:
    - Calls `/api/chat` with session, profile, and insights
    - Processes SSE stream and forwards chunks to callbacks
    - On completion, parses response and builds `AIResponseResult`

- **`src/services/ai/systemPrompt.ts`**
  - `buildSystemPrompt(profile, insights, questionCount)` constructs a **rich, multi-section system prompt** that defines the assistant's behavior:
    - Core objectives, safety rules, style requirements
    - Required XML-like output markers: `<answer>`, `<reasoning>`, `<followup>`, `<summary>`, `<actionitems>`, `<insights>`
    - JSON expectations for `<actionitems>` and `<insights>` with a fixed set of `HealthCategory` values
    - Emphasis on always emitting action items and insights when relevant and on presenting reasoning before conclusions
  - Dynamically appends:
    - **Patient profile context** (name, age, sex, meds, conditions, allergies) when a `PatientProfile` exists
    - **Aggregated insights context** summarized by category from all past `HealthInsight` records
    - **Session state context** noting how many questions have been asked and whether to consider transitioning to a summary

- **`src/services/ai/contextBuilder.ts`**
  - `buildAIContext(session, profile, allInsights)`:
    - Calls `buildSystemPrompt` with the current session's `questionCount` and all **relevant** insights
    - Returns `{ systemPrompt, messages: session.messages }` for use by the API route
  - `getRelevantInsights(allInsights, currentSessionId)` filters out insights whose `sourceSessionId` matches the current session to avoid circular references

- **`src/services/ai/responseParser.ts`**
  - `parseAIResponse(rawResponse)`:
    - Extracts `<answer>`, `<reasoning>`, `<followup>`, `<summary>`, `<actionitems>`, and `<insights>` blocks with regex
    - If `<answer>` is missing, treats the whole response (minus known tagged sections) as the answer
    - For `<summary>`, marks `isSummary: true` and appends summary content to the answer for display
    - Parses `<actionitems>` as JSON into a list of `{ task, why, urgency }` objects; on failure, falls back to a line-based heuristic parser (`parseActionItemsFallback`) that infers tasks and urgency
    - Parses `<insights>` JSON, filtering to valid `HealthCategory` values
    - Flags `isRedFlag` by scanning for urgent-safety phrases (e.g., "seek immediate", "call 911")
  - `getDisplayContent(parsedResponse)` merges `answer` and any `followUpQuestion` into a single string for chat display
  - `buildReasoningStep(parsedResponse)` translates parsed data into a single `ReasoningStep` descriptor:
    - If `isRedFlag` is true → `type: 'safety_flag'` with a standard safety message
    - Else, if `reasoning` exists → `type: 'question_rationale'` with the reasoning text

### Chat UI, sessions, reasoning, and actions

- **`src/components/chat/ChatArea.tsx`**
  - Renders the message list inside a `ScrollArea` and a textarea-based composer with a **Send** button
  - Auto-scrolls to the bottom whenever `messages` changes, using both an end-of-list marker and scroll-area viewport scrolling
  - Keyboard behavior:
    - Enter → send (if non-empty and not loading)
    - Shift+Enter → newline
  - When there are no messages, shows a **Welcome** view with example prompts wired to `onSuggestionClick`, which directly sends a chosen suggestion
  - Displays a "thinking" indicator while `isLoading` is true and the last message is from the user

- **`src/components/chat/SessionList.tsx`**
  - Sidebar listing all `ChatSession`s with a **New Conversation** button
  - Each session item shows title, last updated date, message count, a progress bar for `questionCount` (scaled roughly to a 0–10 range), and small indicators for `hasRedFlag` and `isSummaryMode`

- **`src/components/actions/ActionPanel.tsx`**
  - Displays **action items** associated with the active session
  - Shows completion stats and an urgent badge when there are outstanding urgent items
  - Items are scrollable; each card exposes a way to toggle completion via `onToggleComplete`

- **`src/components/reasoning/ReasoningPanel.tsx`**
  - Consumes `ReasoningStep[]` plus `streamingText` to visualize the assistant's reasoning process over time (e.g., "why I'm asking" / safety messages)

### Profile and trends views

- **`src/components/profile/ProfileTab.tsx`**
  - UI for viewing and editing the `PatientProfile` (basic demographics, medications, conditions, allergies)
  - Typically uses helpers from `useProfile` to mutate the stored profile

- **`src/components/trends/TrendsTab.tsx`**
  - Presents aggregated `HealthInsight` data over time, grouped by `HealthCategory`
  - Typically uses helpers from `useInsights` for category breakdowns and counts

### UI primitives and utilities

- **`src/components/ui/*`**
  - Shadcn-style, Tailwind-based primitives (`button`, `card`, `badge`, `input`, `textarea`, `tabs`, `scroll-area`, etc.) used extensively across the app for consistent styling and behavior
- **`src/lib/utils.ts`**
  - Utility helpers (e.g., class name merging) shared by UI components

### Types and domain model

- **`src/types/index.ts`** is the central type hub:
  - Core domain types: `PatientProfile`, `Medication`, `ChatSession`, `Message`, `ReasoningStep`, `HealthInsight`, `ActionItem`, `AppState`, `AppTab`, `ParsedAIResponse`
  - `HealthCategory` is a string union: `'sleep' | 'energy' | 'digestion' | 'pain' | 'mood' | 'other'` and is used consistently in prompts, parsing, and analytics

---

This file is intended to give future Warp agents enough context to navigate the project structure, understand how state and AI integration are wired together, and use the correct commands to build, lint, and run the app without restating information that can be directly inferred from the filesystem or generic tooling documentation.
