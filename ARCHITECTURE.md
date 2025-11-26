# upNext - Application Architecture Overview

**Documentation Date:** November 25th, 2025  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [High-Level Architecture](#high-level-architecture)
3. [Core Concept: Multi-Embedding Semantic Search](#core-concept-multi-embedding-semantic-search)
4. [Tech Stack](#tech-stack)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Database Architecture](#database-architecture)
8. [Data Flow](#data-flow)
9. [Key Features](#key-features)
10. [Configuration Options](#configuration-options)
11. [Directory Structure](#directory-structure)
12. [API Reference](#api-reference)

---

## Introduction

**upNext** is an AI-powered semantic movie and TV show search application. Unlike traditional keyword-based search, upNext uses natural language understanding to find content that matches not just what you type, but *what you mean*. Users can search by mood, feeling, plot elements, genres, directors, or any combination—and the system intelligently understands the intent.

The tagline says it all: *"Find films that fit your mood, not just your menu."*

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (Vite - Port 3001)                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │   │
│  │  │  SearchBar   │  │  MovieCard   │  │     MovieModal + Trailer   │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘ │   │
│  │                           │                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │              Custom Hooks (useSearch, useRecommendations)     │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────│────────────────────────────────────────┘
                                     │ HTTP API (/api/*)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Express.js Backend (Port 5001)                        │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   index.js   │  │  search.js   │  │ embeddings.js│  │  reranker.js │   │
│  │  (Routes)    │  │(Orchestrator)│  │  (OpenAI)    │  │ (Post-process)│   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐                                        │
│  │   tmdb.js    │  │  config.js   │                                        │
│  │  (Trailers)  │  │ (Env Config) │                                        │
│  └──────────────┘  └──────────────┘                                        │
└────────────────────────────────────│────────────────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│      OpenAI API      │ │   Supabase/Postgres  │ │       TMDB API       │
│                      │ │     + pgvector       │ │                      │
│  • GPT-4o-mini       │ │                      │ │  • Posters           │
│    (query analysis)  │ │  • 990 titles        │ │  • Backdrops         │
│                      │ │  • 3 embeddings each │ │  • Trailers          │
│  • text-embedding-   │ │  • Rich metadata     │ │                      │
│    3-small           │ │                      │ │                      │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

---

## Core Concept: Multi-Embedding Semantic Search

The innovation that powers upNext is a **three-embedding architecture**. Each movie/TV show in the database has three separate vector embeddings, each capturing different aspects of the content:

### 1. Content Embedding (Story/Plot)
Captures narrative elements:
- **Themes**: revenge, redemption, coming-of-age, sacrifice
- **Story structure**: time travel, heist, mystery, found family
- **Character arcs**: protagonist journey, relationships, conflicts
- **Plot elements**: overview, keywords, story slots

### 2. Vibe Embedding (Atmosphere/Mood)
Captures emotional qualities:
- **Vibes**: cozy, dark, whimsical, gritty, dreamlike
- **Tone**: earnest, melancholic, campy, noir, satirical
- **Pacing**: slow-burn, kinetic, contemplative, frenetic
- **Tagline**: the marketing one-liner that captures the "feel"

### 3. Metadata Embedding (Factual/Categorical)
Captures factual information:
- **Genres**: superhero, comedy, thriller, romance, documentary
- **People**: directors, writers, actors
- **Technical**: runtime, certification, production countries
- **Franchise**: collection/series information

### Why Three Embeddings?

Different queries emphasize different aspects:

| Query | Primary Embedding | Weight Distribution |
|-------|-------------------|---------------------|
| "cozy romantic comedies" | **Vibe** | Vibe: 50%, Metadata: 25%, Content: 25% |
| "Christopher Nolan films" | **Metadata** | Metadata: 70%, Content: 20%, Vibe: 10% |
| "time travel paradox story" | **Content** | Content: 60%, Metadata: 25%, Vibe: 15% |
| "dark revenge thriller" | **Balanced** | Vibe: 45%, Content: 35%, Metadata: 20% |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks |
| **Vite 6** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | HTTP server framework |
| **OpenAI API** | Embeddings & LLM analysis |

### Database & APIs
| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL hosting + pgvector |
| **pgvector** | Vector similarity search |
| **TMDB API** | Movie posters, backdrops, trailers |

---

## Backend Architecture

### File Structure

```
server/
├── index.js        # Express server, routes, middleware
├── config.js       # Environment config, validation
├── search.js       # Search orchestration
├── embeddings.js   # OpenAI integration, weight analysis
├── reranker.js     # Post-search result optimization
└── tmdb.js         # TMDB API for trailers
```

### Key Modules

#### `server/index.js` - Express Server
- Sets up Express with CORS and JSON middleware
- Defines API endpoints (`/api/search`, `/api/trailer/:tmdbId`, `/api/health`, `/api/recommendations`)
- Handles request timeouts (60 seconds)
- Pre-warms vector indexes on startup for faster first search
- Serves static frontend in production mode

#### `server/search.js` - Search Orchestration
The heart of the search system:

1. **Get weights** (fixed or dynamic via LLM)
2. **Generate 3 query embeddings** via OpenAI
3. **Run 3 parallel vector searches** against database
4. **Merge and score results** with weighted combination
5. **Apply language filter** (English, English-speaking countries, anime exception)
6. **Re-rank results** with quality signals (if enabled)
7. **Paginate** and return results

#### `server/embeddings.js` - OpenAI Integration
- `getFixedWeights()` - Returns configured static weights
- `analyzeQueryIntent()` - Uses GPT-4o-mini to analyze query and determine dynamic weights
- `structureQuery()` - Expands short queries into full structured text (optional)
- `generateQueryEmbeddings()` - Creates 3 embeddings in one API call

#### `server/reranker.js` - Result Optimization
Post-processing layer that enhances results:
- **Query intent detection**: "best", "recent", "underrated", "classic"
- **Quality scoring**: Rating × vote count confidence
- **Recency scoring**: Boosts recent releases when relevant
- **Completeness penalties**: Demotes items with missing data
- **Diversity filters**: Limits franchise/director clustering

#### `server/config.js` - Configuration
Loads and validates all environment variables:
- API keys (OpenAI, Supabase, TMDB)
- Fixed weight configuration
- Re-ranking weights and thresholds
- Search defaults

---

## Frontend Architecture

### File Structure

```
src/
├── App.jsx                    # Main application component
├── main.jsx                   # React entry point
├── index.css                  # Global styles
├── components/
│   ├── Navbar.jsx            # Top navigation
│   ├── SearchBar.jsx         # Search input with filters
│   ├── ResultsGrid.jsx       # Grid of movie cards
│   ├── MovieCard.jsx         # Individual result card
│   ├── MovieModal.jsx        # Detailed view modal
│   ├── TrailerPlayer.jsx     # YouTube embed
│   ├── ScoreBreakdown.jsx    # Visual score display
│   ├── SkeletonCard.jsx      # Loading placeholder
│   ├── EmptyState.jsx        # No results view
│   └── ui/                   # Reusable UI primitives
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       ├── badge.jsx
│       ├── spinner.tsx
│       ├── ShimmeringText.jsx
│       └── AnimatedModal.jsx
├── hooks/
│   ├── useSearch.js          # Search state management
│   └── useRecommendations.js # Homepage recommendations
└── lib/
    ├── api.js                # Backend API client
    └── utils.js              # Utility functions (cn, etc.)
```

### Key Components

#### `App.jsx` - Main Application
- Manages selected movie state for modal
- Orchestrates loading, error, and empty states
- Displays hero section with search bar
- Shows recommendations on homepage
- Renders results grid or appropriate feedback

#### `useSearch.js` Hook
Custom hook managing search state:
```javascript
{
  results,        // Array of movie results
  loading,        // Initial search loading
  loadingMore,    // Pagination loading
  error,          // Error object with timeout flag
  searchMetadata, // Query info, weights, pagination
  hasMore,        // More pages available
  search(),       // Execute new search
  loadMore(),     // Load next page
  reset()         // Clear all state
}
```

#### `SearchBar.jsx`
- Text input with placeholder examples
- Movie/TV filter toggle
- Loading spinner during search
- Gradient submit button

#### `MovieCard.jsx`
- Poster image with fallback
- Title, year, rating badge
- Genre/vibe tags
- Hover animations
- Click to open modal

#### `MovieModal.jsx`
- Full screen overlay with backdrop
- Complete movie details
- YouTube trailer embed (auto-loads)
- Cast information
- Score breakdown visualization
- ESC key to close

---

## Database Architecture

### Supabase PostgreSQL with pgvector

The database contains ~990 movies/TV shows with rich metadata.

### Key Table: `titles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Movie/show name |
| `kind` | TEXT | "movie" or "tv" |
| `release_date` | DATE | Release date |
| `overview` | TEXT | Plot description |
| `genres` | TEXT[] | Array of genres |
| `vibes` | TEXT[] | Array of mood descriptors |
| `themes` | TEXT[] | Array of thematic elements |
| `tone` | TEXT | Single tone descriptor |
| `pacing` | TEXT | Pacing descriptor |
| `tagline` | TEXT | Marketing tagline |
| `director` | TEXT | Director name |
| `cast` | JSONB | Array of cast objects |
| `vote_average` | FLOAT | TMDB rating |
| `vote_count` | INT | Number of votes |
| `certification` | TEXT | Age rating |
| `runtime_minutes` | INT | Duration |
| `poster_path` | TEXT | TMDB poster path |
| `backdrop_path` | TEXT | TMDB backdrop path |
| `languages` | TEXT[] | Available languages |
| `production_countries` | TEXT[] | Country codes |
| `content_embedding` | vector(1536) | Story/plot embedding |
| `vibe_embedding` | vector(1536) | Mood/atmosphere embedding |
| `metadata_embedding` | vector(1536) | Factual info embedding |

### Vector Search Functions

Three RPC functions for indexed vector search:

```sql
-- Content embedding search
match_titles_by_content(query_embedding, match_threshold, match_count)

-- Vibe embedding search
match_titles_by_vibe(query_embedding, match_threshold, match_count)

-- Metadata embedding search
match_titles_by_metadata(query_embedding, match_threshold, match_count)
```

Each returns `{id, similarity}` sorted by cosine similarity.

### Index Pre-warming

On server startup, `prewarm_vector_indexes()` loads all vector indexes into RAM for faster first searches.

---

## Data Flow

### Search Flow (Step by Step)

```
1. USER types "cozy rainy day movies"
                    │
                    ▼
2. FRONTEND sends POST /api/search
   {query: "cozy rainy day movies", matchCount: 100, matchThreshold: 0.4}
                    │
                    ▼
3. BACKEND determines weights
   - Fixed mode: Uses config (0.40/0.35/0.25)
   - Dynamic mode: GPT-4o-mini analyzes intent → {content: 0.25, vibe: 0.55, metadata: 0.20}
                    │
                    ▼
4. EMBEDDINGS generated via OpenAI
   - Content: "Story: cozy rainy day movies. Overview: cozy rainy day movies. Themes: cozy rainy day movies"
   - Vibe: "Vibes: cozy rainy day movies. Tone: cozy rainy day movies. Tagline: cozy rainy day movies"
   - Metadata: "Genres: cozy rainy day movies. Type: cozy rainy day movies. Keywords: cozy rainy day movies"
   → Returns 3 x 1536-dimension vectors
                    │
                    ▼
5. DATABASE executes 3 parallel vector searches
   - match_titles_by_content(content_embedding)
   - match_titles_by_vibe(vibe_embedding)
   - match_titles_by_metadata(metadata_embedding)
                    │
                    ▼
6. MERGE & SCORE results
   - Combine unique titles from all 3 searches
   - Calculate: combined_score = content_score×0.25 + vibe_score×0.55 + metadata_score×0.20
   - Identify strongest signal per result
                    │
                    ▼
7. LANGUAGE FILTER
   - Keep: English language, English-speaking countries, Japanese anime
   - Remove: Non-English without exceptions
                    │
                    ▼
8. RE-RANKING (if enabled)
   - Detect intent: "best", "recent", "underrated", "classic"
   - Calculate: quality, popularity, recency scores
   - Apply completeness penalties
   - Apply diversity constraints
   - Final: 75% semantic + 15% quality + 5% popularity + 5% recency
                    │
                    ▼
9. PAGINATE & RETURN
   {
     query: "cozy rainy day movies",
     weights: {content: 0.25, vibe: 0.55, metadata: 0.20},
     results: [{title: "You've Got Mail", combined_score: 0.72, ...}, ...],
     hasMore: true,
     page: 1,
     totalCount: 45
   }
                    │
                    ▼
10. FRONTEND renders ResultsGrid with MovieCards
```

---

## Key Features

### 1. Natural Language Search
Search by any description—mood, plot, genre, people, or combinations.

### 2. Adaptive Weighting
Two modes:
- **Fixed weights** (default): Fast, consistent, configurable
- **Dynamic weights**: GPT-4o-mini analyzes each query for optimal weights

### 3. Multi-Vector Search
Three parallel indexed searches merged with weighted scoring.

### 4. Intelligent Re-ranking
Post-processing that boosts quality, handles special queries ("best", "underrated"), and ensures diversity.

### 5. YouTube Trailers
TMDB integration fetches official trailers embedded directly in the modal.

### 6. Pagination
Load more results on demand without re-running the full search.

### 7. Type Filtering
Filter results to Movies only, TV only, or both.

### 8. Beautiful UI
Apple-inspired design with glass-morphism, gradients, and smooth animations.

---

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *required* | OpenAI API key |
| `SUPABASE_URL` | *required* | Supabase project URL |
| `SUPABASE_ANON_KEY` | *required* | Supabase anon key |
| `TMDB_TOKEN` | *optional* | TMDB API token for trailers |
| `PORT` | 5001 | Backend server port |

### Weight Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_DYNAMIC_WEIGHTS` | false | Enable LLM-based weight analysis |
| `FIXED_WEIGHT_CONTENT` | 0.40 | Content embedding weight |
| `FIXED_WEIGHT_VIBE` | 0.35 | Vibe embedding weight |
| `FIXED_WEIGHT_METADATA` | 0.25 | Metadata embedding weight |

### Re-ranking Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_RERANKING` | true | Enable post-search re-ranking |
| `RERANK_WEIGHT_SEMANTIC` | 0.75 | Semantic score weight |
| `RERANK_WEIGHT_QUALITY` | 0.15 | Quality score weight |
| `RERANK_WEIGHT_POPULARITY` | 0.05 | Popularity score weight |
| `RERANK_WEIGHT_RECENCY` | 0.05 | Recency score weight |
| `RERANK_MAX_SAME_COLLECTION` | 2 | Max titles from same franchise |
| `RERANK_MAX_SAME_DIRECTOR` | 3 | Max titles from same director |

### Search Defaults

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_MATCH_COUNT` | 100 | Default results to fetch |
| `DEFAULT_MATCH_THRESHOLD` | 0.4 | Minimum similarity score |

---

## Directory Structure

```
upNext/
├── server/                    # Backend Node.js/Express
│   ├── index.js              # Main server entry point
│   ├── config.js             # Environment configuration
│   ├── search.js             # Search orchestration
│   ├── embeddings.js         # OpenAI integration
│   ├── reranker.js           # Result post-processing
│   └── tmdb.js               # TMDB API integration
│
├── src/                       # Frontend React
│   ├── App.jsx               # Main React component
│   ├── main.jsx              # React entry point
│   ├── index.css             # Global styles
│   ├── components/           # UI components
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utilities & API client
│
├── dist/                      # Production build output
├── node_modules/              # Dependencies
│
├── package.json              # Dependencies & scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── nixpacks.toml             # Deployment configuration
│
├── README.md                 # User documentation
├── CLAUDE.md                 # AI assistant guide
└── ARCHITECTURE.md           # This file
```

---

## API Reference

### POST `/api/search`

Execute a semantic search.

**Request:**
```json
{
  "query": "cozy romantic comedies",
  "matchCount": 100,
  "matchThreshold": 0.4,
  "kindFilter": ["movie"],
  "page": 1,
  "pageSize": 20
}
```

**Response:**
```json
{
  "query": "cozy romantic comedies",
  "weights": {
    "content": 0.25,
    "vibe": 0.50,
    "metadata": 0.25
  },
  "weightReasoning": "Using fixed weights from configuration",
  "weightSource": "fixed",
  "results": [
    {
      "id": "abc-123",
      "title": "You've Got Mail",
      "kind": "movie",
      "release_date": "1998-12-18",
      "overview": "...",
      "genres": ["Comedy", "Romance"],
      "vibes": ["heartwarming", "cozy", "charming"],
      "content_score": 0.65,
      "vibe_score": 0.78,
      "metadata_score": 0.62,
      "combined_score": 0.72,
      "strongest_signal": "vibe",
      "poster_path": "/abc123.jpg"
    }
  ],
  "count": 20,
  "totalCount": 45,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3,
  "hasMore": true,
  "rerankingApplied": true,
  "metadata": {
    "duration_ms": 1523,
    "timestamp": "2025-11-25T12:00:00.000Z"
  }
}
```

### GET `/api/trailer/:tmdbId`

Fetch trailer information.

**Query Parameters:**
- `mediaType`: "movie" | "tv" (default: "movie")

**Response:**
```json
{
  "key": "dQw4w9WgXcQ",
  "name": "Official Trailer",
  "site": "YouTube",
  "type": "Trailer",
  "official": true,
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ"
}
```

### GET `/api/recommendations`

Fetch homepage recommendations.

**Response:**
```json
{
  "results": [
    {
      "id": "abc-123",
      "title": "Inception",
      "kind": "movie",
      "poster_path": "/abc123.jpg",
      "vote_average": 8.4
    }
  ],
  "metadata": {
    "count": 20,
    "timestamp": "2025-11-25T12:00:00.000Z"
  }
}
```

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-25T12:00:00.000Z",
  "database": {
    "connected": true
  }
}
```

---

## Performance Characteristics

| Metric | Fixed Weights | Dynamic Weights |
|--------|---------------|-----------------|
| **Average search time** | ~1.5s | ~3-5s |
| **LLM calls per search** | 0 | 1 |
| **Embedding calls** | 1 | 1 |
| **DB calls** | 4 (3 vectors + 1 fetch) | 4 |
| **Re-ranking overhead** | ~50-100ms | ~50-100ms |

---

## Development Commands

```bash
# Start both frontend and backend
npm run dev

# Start frontend only (port 3001)
npm run dev:client

# Start backend only (port 5001)
npm run dev:server

# Build for production
npm run build

# Preview production build
npm run preview

# Start production server
npm run start
```

---

*Last updated: November 25th, 2025*

