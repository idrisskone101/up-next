# upNext - Architecture

## Overview

upNext turns a free-form request into a ranked list of movies/TV shows. An LLM (GPT-6 Luna by default) acts as the curator; TMDB is the source of truth for every title shown.

```
React (Vite, :3001) ──/api──► Express (:5001)
                                 ├─ search.js  → OpenAI chat completions (JSON schema)
                                 ├─ tmdb.js    → TMDB search/details/videos/trending
                                 └─ cache.js   → in-memory TTL cache
```

## Backend (`server/`)

| File | Responsibility |
|------|----------------|
| `index.js` | Express app, validation, rate limiting (30 req/min on search endpoints), static frontend in production |
| `config.js` | Env config: `OPENAI_API_KEY`, `TMDB_TOKEN` (required), model, reasoning effort, service tier, cache TTL |
| `search.js` | Curator prompt, LLM call, TMDB hydration, filtering, movie/TV interleave, caching. Exports `searchTitles()` and `findSimilarTitles()` |
| `tmdb.js` | TMDB client: `findTitle()` (title+year matching), `getTitleDetails()`, `searchTitlesByName()`, `getTrending()`, `fetchTrailer()` |
| `cache.js` | `TTLCache` class |

### Search flow (`searchTitles`)

1. Cache lookup (key: query + filters).
2. `askModel()` sends the system prompt plus the request and its constraints (movie/TV only, minimum year). Structured outputs enforce `{ suggestions: [{ title, year, kind, reason }] }`, up to 20 items.
3. `hydrate()` resolves every suggestion in parallel:
   - `findTitle()` searches TMDB with the year first. It accepts an exact normalized title within ±1 year, then searches without the year and tries close variants ("Hachi" ↔ "Hachi: A Dog's Tale"), the same title from another year, or a top hit from the right year ("12 Monkeys" ↔ "Twelve Monkeys"). If nothing matches, it retries as the other kind, because the model sometimes mislabels miniseries.
   - `getTitleDetails()` pulls details, credits, US certification and US watch providers in one call (`append_to_response`).
4. Drop unmatched, duplicate, and filtered-out titles (kind, min year, excluded genres such as documentary/reality).
5. When no type filter is set, interleave movies and TV proportionally, keeping the model's order within each kind.

`findSimilarTitles()` fetches the source title from TMDB, builds a "Movies/Shows like X" request with its genres, creator and overview, and reuses steps 2-5, excluding the source title.

### Prompt design (`SYSTEM_PROMPT` in `search.js`)

The prompt was tuned against an eval set of vibe, mood, person, comparison, stacked-constraint, filter and similar-title queries. Key rules:
- Satisfy every constraint in the request, and treat tone words as seriously as genre.
- Lead with canonical, well-loved titles; missing an obvious classic is worse than skipping an obscure one.
- Aim for 20 titles; return fewer only for inherently narrow requests (one person's filmography).
- Requests for a person's work list only that work, with no producer credits, cameos or shorts.
- At most one title per franchise; no documentaries or reality TV unless asked.
- Reasons are specific to the request (max 20 words), not plot summaries.

### Latency and cost

- `reasoning_effort: low` gives the best quality/speed balance; `none` is faster but weaker.
- `service_tier: priority` is roughly 1.5-2x faster than default.
- Output tokens dominate (~45 per pick), so the list is capped at 20, one grid page.
- Results are cached for 30 minutes.

## Frontend (`src/`)

- `App.jsx`: view state (hero / results), search handlers, More Like This → similar search.
- `hooks/useSearch.js`: fetches results once and paginates locally (20/page).
- `lib/api.js`: `searchMovies(query, kindFilter, minReleaseYear, excludeGenres)`, `findSimilar(titleId, kind, ...)`, `searchTitles()` for mentions, `fetchTrailer()`.
- `components/ResultsGrid.jsx` → `MovieCard`, `MovieDrawer`/`MovieDetail` (desktop), `MovieBottomSheet` (mobile). The detail views show the model's `reason` as "Why it's a match".
- `components/HeroSearchCard.jsx` + `MentionDropdown.jsx`: `@title` mentions backed by TMDB multi-search.

UI rules live in `DESIGN_SYSTEM.md`.

## History

v1 used Supabase Postgres + pgvector with ~60k titles, each carrying content, vibe and metadata embeddings. Queries were embedded, weighted (optionally by an LLM) and searched with a `match_titles_multi` RPC, then reranked. `OPTIMIZATION_RESULTS.md` and `TIMEOUT_INVESTIGATION.md` document that system. The database was retired, and v2 replaced the retrieval layer while keeping the UI.
