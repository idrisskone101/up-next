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

### Security

- Never introduce command injection, XSS, SQL injection, or OWASP top 10 vulnerabilities
- If you notice insecure code, fix immediately

### Frontend Changes

**All UI changes MUST follow `DESIGN_SYSTEM.md`.** No exceptions.

Key reminders:
- Dark luxury cinema aesthetic with warm amber accents
- Touch-first: minimum 44px targets
- Glassmorphism-lite surfaces
- Framer Motion for micro-interactions

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
