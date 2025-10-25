# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

upNext is an AI-powered semantic movie and TV show search application using multi-embedding vector search with LLM-driven dynamic weight adjustment. The system uses three separate embeddings (content, vibe, metadata) for each title and employs GPT-4o-mini to analyze queries and determine optimal weighting strategies.

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
2. GPT-4o-mini analyzes query intent and calculates optimal weights (e.g., "cozy romantic comedies" → vibe: 60%, metadata: 25%, content: 15%)
3. Generate three separate query embeddings using OpenAI text-embedding-3-small
4. Supabase RPC function `match_titles_multi()` performs weighted multi-vector search
5. Results returned sorted by combined similarity score

### Backend (Express.js - Port 5001)

**Key Files:**
- `server/index.js` - Express server with API endpoints
- `server/search.js` - Orchestrates query analysis, embedding generation, and database search
- `server/embeddings.js` - GPT-4o-mini query analysis and OpenAI embedding generation
- `server/tmdb.js` - TMDB API integration for trailers
- `server/config.js` - Environment configuration

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

# OpenAI (GPT-4o-mini for analysis, text-embedding-3-small for embeddings)
OPENAI_API_KEY=your-openai-key

# Server
PORT=5001  # Optional, defaults to 5001
```

## Key Implementation Details

### Weight Analysis (server/embeddings.js:analyzeQueryIntent)

The LLM analyzes queries using specific rules:
- Genre/franchise/director/actor mentions → METADATA priority (0.5-0.7)
- Plot/story/theme descriptions → CONTENT priority (0.5-0.7)
- Mood/feeling/atmosphere adjectives → VIBE priority (0.5-0.7)
- Ambiguous queries → balanced weights (0.4, 0.35, 0.25)

Fallback weights if LLM fails: `{content: 0.4, vibe: 0.35, metadata: 0.25}`

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

- **No client-side re-ranking**: Database search results are final and sorted by combined score
- **Average search time**: 3-5 seconds (LLM analysis ~1-2s, embedding generation ~1s, database ~0.5s)
- **Poster images**: Use TMDB CDN `https://image.tmdb.org/t/p/w500${poster_path}`
- **TMDB integration**: Requires API Read Access Token from themoviedb.org for trailer feature
- **Concurrent requests**: Backend handles multiple simultaneous searches
- **Error handling**: Always uses fallback weights if LLM analysis fails

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

### Modifying Weight Analysis

Edit the system prompt in `server/embeddings.js:analyzeQueryIntent()`. The LLM must return JSON with weights summing to 1.0 and include reasoning. Always normalize weights if they don't sum to exactly 1.0.

## Database Schema Notes

The `titles` table uses JSONB for complex fields:
- `cast`: Array of objects with name, character, order, profile_path
- `slots`: Story structure object with protagonist, setting_place, setting_time, goal, obstacle, stakes
- `providers`: Streaming availability data
- `payload`: Additional metadata

When querying, use JSONB operators or cast to text for searching within these fields.
