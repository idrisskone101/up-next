# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

upNext is an AI-powered semantic movie and TV show search application using multi-embedding vector search. The system uses three separate embeddings (content, vibe, metadata) for each title and supports both fixed weights (fast, consistent) and dynamic LLM-driven weight adjustment (adaptive).

## Development Commands

### Start Development
```bash
# Start both frontend and backend concurrently
npm run dev

# Start frontend only (port 3001)
npm run dev:client

# Start backend only (port 5001)
npm run dev:server
```

### Build & Preview
```bash
# Build frontend for production
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Test backend API directly
npm run test:api
```

## Architecture

### Multi-Embedding Search System

The core innovation is the three-embedding architecture:

1. **Content Embedding** (story/plot): Narrative themes, story structure, character arcs, plot elements
2. **Vibe Embedding** (atmosphere): Mood, tone, pacing, emotional qualities, tagline
3. **Metadata Embedding** (factual): Genres, directors, cast, keywords, certifications

**Query Processing Flow:**
1. User query → Backend `/api/search` endpoint
2. **Weight Selection** (configurable):
   - **Fixed Mode** (default): Uses pre-configured weights from .env (fast, consistent)
   - **Dynamic Mode**: GPT-4o-mini analyzes query intent and calculates optimal weights
3. Generate three separate query embeddings using OpenAI text-embedding-3-small
4. Supabase RPC function `match_titles_multi()` performs weighted multi-vector search
5. Results returned sorted by combined similarity score

### Backend (Express.js - Port 5001)

**Key Files:**
- `server/index.js` - Express server with API endpoints
- `server/search.js` - Orchestrates query analysis, embedding generation, and database search
- `server/embeddings.js` - Weight calculation (fixed or LLM) and OpenAI embedding generation
- `server/config.js` - Environment configuration with weight settings
- `server/tmdb.js` - TMDB API integration for trailers

**API Endpoints:**
- `POST /api/search` - Main search endpoint (query, matchCount, matchThreshold)
- `GET /api/trailer/:tmdbId?mediaType=movie|tv` - Fetch YouTube trailer
- `GET /api/health` - Health check for server and database

### Frontend (React + Vite - Port 3001)

**Key Files:**
- `src/App.jsx` - Main application with search states (loading, error, results, empty)
- `src/hooks/useSearch.js` - Custom hook managing search state and API calls
- `src/lib/api.js` - API client for backend communication
- `src/components/` - UI components (SearchBar, MovieCard, MovieModal, ResultsGrid, ScoreBreakdown, TrailerPlayer, LoadingSpinner)

**Design Philosophy:** Apple-inspired clean minimal design with glass-morphism effects, gradient backgrounds, and smooth animations using Tailwind CSS.

### Database (Supabase PostgreSQL + pgvector)

**Table:** `titles` (990 movies/TV shows)

**Key Fields:**
- Three vector embeddings: `content_embedding`, `vibe_embedding`, `metadata_embedding` (1536-dimensional each)
- Rich metadata: `genres`, `cast`, `director`, `certification`, `keywords`
- Enriched content: `vibes`, `themes`, `tone`, `pacing`, `slots` (story structure), `tagline`
- TMDB data: `poster_path`, `backdrop_path`, `vote_average`, `runtime_minutes`

**Search Function:** `match_titles_multi()` - Custom PostgreSQL function that performs weighted multi-embedding cosine similarity search and returns individual scores (content_score, vibe_score, metadata_score), combined_score, and strongest_signal indicator.

## Environment Setup

Required environment variables in `.env`:

```bash
# TMDB (for trailer feature)
TMDB_TOKEN=your-tmdb-read-access-token

# Supabase
SUPABASE_URL=REDACTED
SUPABASE_ANON_KEY=your-anon-key

# OpenAI (text-embedding-3-small for embeddings, GPT-4o-mini for dynamic weights)
OPENAI_API_KEY=your-openai-key

# Server
PORT=5001  # Optional, defaults to 5001

# ===== WEIGHT CONFIGURATION =====

# Weight Mode (default: false = fixed weights)
USE_DYNAMIC_WEIGHTS=false  # Set to true to enable LLM-based weight analysis

# Fixed Weights (only used when USE_DYNAMIC_WEIGHTS=false)
# Must sum to 1.0 - adjust to optimize search relevance
FIXED_WEIGHT_CONTENT=0.40    # Story/plot/narrative (0.0-1.0)
FIXED_WEIGHT_VIBE=0.35       # Mood/tone/atmosphere (0.0-1.0)
FIXED_WEIGHT_METADATA=0.25   # Genres/cast/director (0.0-1.0)
```

## Key Implementation Details

### Weight Configuration

**Fixed Weights (Default - Recommended)**
- Located in `server/config.js`, configured via `.env`
- Fast: No LLM call, ~50-60% faster searches (1.5s vs 3-5s)
- Consistent: Same query always returns same results
- Cost-effective: No GPT-4o-mini API calls
- Tunable: Adjust weights in `.env` without code changes
- Server validates weights sum to 1.0 on startup

**Dynamic Weights (Optional)**
- Set `USE_DYNAMIC_WEIGHTS=true` in `.env`
- GPT-4o-mini analyzes each query and calculates optimal weights
- Weighting rules:
  - Genre/franchise/director/actor → METADATA priority (0.5-0.7)
  - Plot/story/theme descriptions → CONTENT priority (0.5-0.7)
  - Mood/feeling/atmosphere adjectives → VIBE priority (0.5-0.7)
  - Ambiguous queries → balanced weights
- Falls back to fixed weights if LLM fails

**Tuning Fixed Weights:**
```bash
# Balanced (default)
FIXED_WEIGHT_CONTENT=0.40
FIXED_WEIGHT_VIBE=0.35
FIXED_WEIGHT_METADATA=0.25

# Content-heavy (for story/plot-focused users)
FIXED_WEIGHT_CONTENT=0.60
FIXED_WEIGHT_VIBE=0.25
FIXED_WEIGHT_METADATA=0.15

# Vibe-heavy (for mood/atmosphere-focused users)
FIXED_WEIGHT_CONTENT=0.20
FIXED_WEIGHT_VIBE=0.60
FIXED_WEIGHT_METADATA=0.20

# Metadata-heavy (for genre/actor/director searches)
FIXED_WEIGHT_CONTENT=0.20
FIXED_WEIGHT_VIBE=0.20
FIXED_WEIGHT_METADATA=0.60
```

### Embedding Generation (server/embeddings.js:generateQueryEmbeddings)

Query is formatted three different ways to match database embedding creation:
```javascript
{
  content: `Story: ${query}. Overview: ${query}. Themes: ${query}`,
  vibe: `Vibes: ${query}. Tone: ${query}. Tagline: ${query}`,
  metadata: `Genres: ${query}. Type: ${query}. Keywords: ${query}`
}
```

All three embeddings generated in single OpenAI API call for efficiency.

### Search Result Structure

Each result includes:
- Title metadata (title, kind, release_date, overview, genres, etc.)
- Individual similarity scores for each embedding type (0-1 range)
- Combined weighted score
- Strongest signal indicator (which embedding matched best)
- Weight source ("fixed" or "dynamic")
- TMDB integration (poster images, trailers, backdrop images)

### Vite Proxy Configuration

Frontend proxies `/api` requests to backend:
```javascript
server: {
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true
    }
  }
}
```

## Important Notes

- **Weight mode**: Fixed weights (default) are recommended for better performance and consistency
- **No client-side re-ranking**: Database search results are final and sorted by combined score
- **Search time**: ~1.5s with fixed weights, ~3-5s with dynamic weights
- **Poster images**: Use TMDB CDN `https://image.tmdb.org/t/p/w500${poster_path}`
- **TMDB integration**: Requires API Read Access Token from themoviedb.org for trailer feature
- **Concurrent requests**: Backend handles multiple simultaneous searches
- **Error handling**: Dynamic mode falls back to fixed weights if LLM analysis fails

## Code Patterns

### Adding New Search Parameters

1. Update `POST /api/search` endpoint in `server/index.js` to accept new parameters
2. Pass parameters to `searchTitles()` in `server/search.js`
3. Update Supabase RPC call with new parameters
4. Modify frontend `searchMovies()` in `src/lib/api.js`
5. Update `useSearch` hook to accept and pass new parameters

### Adding New UI Components

- Use glass-morphism style: `className="glass"` (defined in tailwind config)
- Follow Apple design: clean, minimal, generous whitespace
- Use color scheme: cyan/blue gradients for accents, white text, semi-transparent backgrounds
- Add animations: `animate-fade-in`, `transition-all duration-200`, `hover:scale-105`

### Modifying Weight Configuration

**For Fixed Weights:**
- Edit `.env` file and update `FIXED_WEIGHT_*` values
- Restart server (weights are validated on startup)
- No code changes needed

**For Dynamic Weight Logic:**
- Edit system prompt in `server/embeddings.js:analyzeQueryIntent()`
- LLM must return JSON with weights summing to 1.0 and include reasoning
- Always normalize weights if they don't sum to exactly 1.0

## Database Schema Notes

The `titles` table uses JSONB for complex fields:
- `cast`: Array of objects with name, character, order, profile_path
- `slots`: Story structure object with protagonist, setting_place, setting_time, goal, obstacle, stakes
- `providers`: Streaming availability data
- `payload`: Additional metadata

When querying, use JSONB operators or cast to text for searching within these fields.

## Re-Ranking System

**NEW:** upNext now includes an intelligent re-ranking layer that enhances semantic search results by incorporating quality signals, recency, diversity optimization, and query intent detection.

### Overview

Re-ranking is applied **after** semantic search to refine result ordering without changing which titles match. It combines:
- **Semantic similarity** (75% weight) - Preserves core search relevance
- **Quality signals** (15% weight) - Boosts highly-rated, well-reviewed titles
- **Popularity signals** (5% weight) - Considers vote counts and popularity scores
- **Recency signals** (5% weight) - Boosts recent releases for time-sensitive queries

### Key Features

#### 1. Query Intent Detection
The system detects keywords and adjusts ranking accordingly:

- **"best"** queries → Boost by vote_average (e.g., "best Christopher Nolan films")
- **"recent"** queries → Boost 2024-2025 releases (e.g., "recent sci-fi movies")
- **"underrated"** queries → Boost high quality + lower popularity titles
- **"classic"** queries → Boost older films with high ratings

#### 2. Quality Boosting
Combines vote_average with vote_count confidence:
```javascript
quality_score = (vote_average / 10) * 0.7 + 
                (log10(vote_count + 1) / 5) * 0.3
```

Example: A film with 8.5★ and 10,000 votes scores higher than 8.5★ with 100 votes

#### 3. Completeness Penalties
Titles with missing data are penalized:
- No description → 0.85x multiplier
- Missing vibes/themes → 0.95x multiplier

Example: "Las nubes" with 10.0★ but no description drops in ranking

#### 4. Diversity Optimization
Prevents result clustering:
- Max 2 titles from same franchise/collection
- Max 3 titles from same director
- Excess titles receive 0.85x penalty

Example: When searching "Christopher Nolan", Batman trilogy is limited to 2 results

### Performance

- **Overhead:** ~50-100ms per search
- **Process:** Top 50 results from semantic search
- **Return:** Top 20 re-ranked results
- **Total time:** 1.5s (semantic) + 0.1s (rerank) = **1.6s** (still faster than dynamic weights)

### Configuration

Re-ranking is configured via `.env` and enabled by default:

```bash
# Enable/disable re-ranking
ENABLE_RERANKING=true  # Set to false to disable

# Weight distribution (must sum to 1.0)
RERANK_WEIGHT_SEMANTIC=0.75    # Preserve semantic relevance
RERANK_WEIGHT_QUALITY=0.15     # Boost quality signals
RERANK_WEIGHT_POPULARITY=0.05  # Boost popularity
RERANK_WEIGHT_RECENCY=0.05     # Boost recent releases

# Diversity constraints
RERANK_MAX_SAME_COLLECTION=2   # Max from same franchise
RERANK_MAX_SAME_DIRECTOR=3     # Max from same director

# Completeness threshold
RERANK_COMPLETENESS_THRESHOLD=0.85  # Penalty for missing data
```

### Example Improvements

#### Before Re-Ranking: "best Christopher Nolan films"
1. The Dark Knight Rises (56%, 7.8★)
2. Interstellar (55%, 8.5★)
3. The Dark Knight (55%, 8.5★)
4. Inception (54%, 8.4★)

#### After Re-Ranking: "best Christopher Nolan films"
1. Interstellar (8.5★) ⬆️
2. The Dark Knight (8.5★) ⬆️
3. Inception (8.4★) ⬆️
4. The Dark Knight Rises (7.8★) ⬇️

The system detected "best" keyword and boosted by quality (vote_average).

#### Before Re-Ranking: "underrated thriller"
1. Las nubes (53%, 10.0★, **no description**)
2. Gone Girl (52%, 7.9★)
3. The Amateur (52%, 7.0★)

#### After Re-Ranking: "underrated thriller"
1. Se7en (51%, 8.4★) ⬆️
2. Fight Club (50%, 8.4★) ⬆️
3. Psycho (50%, 8.4★) ⬆️
4. Gone Girl (52%, 7.9★)
5. Las nubes (53%, 10.0★, no description) ⬇️ **Penalized for missing data**

### Implementation Files

- `server/reranker.js` - Core re-ranking engine with scoring algorithms
- `server/search.js` - Integration point (calls reranker after Supabase)
- `server/config.js` - Configuration loading and validation

### Disabling Re-Ranking

If you prefer pure semantic search without quality signals:

1. Set `ENABLE_RERANKING=false` in `.env`
2. Restart server
3. Results will be sorted purely by semantic similarity

### Tuning Re-Ranking

Adjust weights based on your preferences:

**More Quality-Focused:**
```bash
RERANK_WEIGHT_SEMANTIC=0.65
RERANK_WEIGHT_QUALITY=0.25
RERANK_WEIGHT_POPULARITY=0.05
RERANK_WEIGHT_RECENCY=0.05
```

**More Recency-Focused:**
```bash
RERANK_WEIGHT_SEMANTIC=0.70
RERANK_WEIGHT_QUALITY=0.10
RERANK_WEIGHT_POPULARITY=0.05
RERANK_WEIGHT_RECENCY=0.15
```

**Pure Semantic (minimal re-ranking):**
```bash
RERANK_WEIGHT_SEMANTIC=0.90
RERANK_WEIGHT_QUALITY=0.05
RERANK_WEIGHT_POPULARITY=0.03
RERANK_WEIGHT_RECENCY=0.02
```

