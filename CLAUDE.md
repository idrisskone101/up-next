# CLAUDE.md

Guidance for Claude Code when working with this repository.

**Be extremely concise.** Sacrifice grammar for brevity in all responses and commit messages.

## Project Overview

upNext: AI-powered semantic movie/TV search using multi-embedding vector search. Three embeddings (content, vibe, metadata) per title with configurable weighting.

## Quick Reference

```bash
npm run dev          # Start frontend + backend
npm run dev:client   # Frontend only (port 3001)
npm run dev:server   # Backend only (port 5001)
```

See `ARCHITECTURE.md` for full technical details.

## Coding Standards

### General

- Read before modifying. Never propose changes to unread code
- Avoid over-engineering. Only make directly requested changes
- Don't add features, refactor code, or make "improvements" beyond what was asked
- Don't add docstrings/comments/type annotations to unchanged code
- Only add comments where logic isn't self-evident
- If something is unused, delete it completely. No backwards-compatibility hacks

### Best Practices

- **KISS**: Simplest solution wins. No premature optimization
- **DRY**: Extract shared logic only when pattern repeats 3+ times
- **YAGNI**: Don't build for hypothetical futures
- **Single Responsibility**: Each function/component does one thing well
- **Ask first**: If anything is unclear, ask before assuming

### Security

- Never introduce command injection, XSS, SQL injection, or OWASP top 10 vulnerabilities
- If you notice insecure code, fix immediately

### Frontend Changes

**All UI changes MUST follow `DESIGN_SYSTEM.md`.** No exceptions. Read it before any frontend work.

#### Design Language: Arc Browser + Spotify

This app uses a "Cinematic Command Center" aesthetic inspired by:
- **Arc browser**: Minimal chrome, collapsible sidebar, command palette (Cmd+K), spatial organization
- **Spotify**: Discovery feeds, rich cards, smooth transitions, progressive disclosure

#### Core Principles
1. **Discovery over search** - Content surfaces before you ask
2. **Warm darkness** - Amber accents only (NEVER cyan/teal)
3. **Fluid motion** - Spring physics via Framer Motion
4. **Touch-first** - Minimum 44px targets
5. **Paired animations** - Every enter has matching exit

#### Key Patterns
- Sidebar: 64px collapsed / 280px expanded / drawer on mobile
- Command palette: Cmd+K overlay with keyboard nav
- Cards: Rounded corners (min `rounded-lg`), hover lift + glow
- Match badges: Amber scale only (`amber-500` excellent, `amber-600` good, `white/20` fair)

#### Quick Reference
```
Colors:     bg-[#0a0a0f] base, bg-[#121218] elevated, amber-400 accent
Typography: Pacifico (logo), Outfit (headings), Nunito (body)
Animation:  spring(300, 24) for UI, spring(400, 30) for hover
Touch:      h-11 (44px) minimum for all interactive elements
```

**Design agents**: Always read `DESIGN_SYSTEM.md` before proposing or implementing UI changes.

### Adding Search Parameters

1. Update `POST /api/search` in `server/index.js`
2. Pass to `searchTitles()` in `server/search.js`
3. Update Supabase RPC call
4. Modify `searchMovies()` in `src/lib/api.js`
5. Update `useSearch` hook

### Modifying Weights

**Fixed:** Edit `.env`, restart server
**Dynamic:** Edit `server/embeddings.js:analyzeQueryIntent()`

## Planning

At the end of each plan, list unresolved questions. Keep questions extremely concise. Sacrifice grammar for brevity.

Ask clarifying questions when anything is unclear.
