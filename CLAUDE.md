# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

In all instructions and commit messages, be extremely concise and sacrifice a grammar for the sake of concision.

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

**Design Philosophy:** Dark luxury cinema aesthetic - see **Visual Design System** section. Warm amber/gold accents on deep blacks, glassmorphism-lite surfaces, generous rounding, touch-first interactions. Uses Cabinet Grotesk (body), Syne (headings), Instrument Serif (logo).

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

### Query Structuring (server/embeddings.js:structureQuery)

**NEW:** upNext includes an intelligent query structuring system that expands lazy queries into rich, structured text matching how database embeddings were originally created.

#### Overview

When `USE_QUERY_STRUCTURING=true` in `.env`, the system uses GPT-4o-mini to transform simple queries like "Cosy Night In" into detailed structured text across all three embedding dimensions before generating embeddings.

#### How It Works

**Input:** Simple user query (e.g., "Cosy Night In")

**Output:** Three structured text blocks matching database embedding creation:

1. **Content Structure** (matches: profile_string, themes, overview, slots, keywords)
```javascript
"Profile: A heartwarming story perfect for a relaxing evening. 
Overview: A feel-good narrative focusing on comfort, warmth, and simple pleasures. 
Themes: comfort, relaxation, warmth, home, togetherness. 
Story structure: Characters seeking peace and connection in familiar settings. 
Keywords: cozy, relaxing, heartwarming, comfort, home"
```

2. **Vibe Structure** (matches: vibes, tone, pacing, tagline)
```javascript
"Vibes: cozy, warm, comforting, relaxing, intimate. 
Tone: gentle, soothing, heartwarming. 
Pacing: slow-burn, contemplative, leisurely. 
Tagline: The perfect companion for a quiet evening at home"
```

3. **Metadata Structure** (matches: genres, director, writers, certification, countries, collection)
```javascript
"Genres: romance, comedy, drama, family. 
Director: Feel-good filmmakers known for intimate character studies. 
Writers: Writers who excel at cozy, character-driven narratives. 
Certification: PG, PG-13, TV-PG. 
Countries: UK, US, France. 
Collection: Comfort cinema, feel-good films"
```

#### Database Field Mapping

The structuring system mirrors how database embeddings were created from these fields:

**Content Embedding Sources:**
- `profile_string`: One-sentence spoiler-safe logline
- `themes`: Array of narrative themes (e.g., ["revenge", "coming-of-age"])
- `overview`: 2-3 sentence plot description
- `slots`: Story structure (protagonist, setting, goal, obstacle, stakes)
- `keywords`: Relevant story keywords

**Vibe Embedding Sources:**
- `vibes`: Array of mood descriptors (e.g., ["cozy", "dark", "whimsical"])
- `tone`: Single tone descriptor (e.g., "earnest", "melancholic", "noir")
- `pacing`: Single pacing descriptor (e.g., "slow-burn", "kinetic", "contemplative")
- `tagline`: Marketing tagline or atmospheric one-liner

**Metadata Embedding Sources:**
- `genres`: Array of genre names (e.g., ["drama", "romance", "comedy"])
- `director`: Director name or style description
- `writers`: Writer names or style descriptions
- `certification`: Age rating (e.g., "PG-13", "R", "TV-MA")
- `production_countries`: Country codes or names
- `collection`: Franchise or series name

#### Configuration

```bash
# Enable/disable query structuring (default: false)
USE_QUERY_STRUCTURING=true
```

#### Performance Impact

- **Overhead:** +500-800ms per search (additional LLM call)
- **Benefits:** Much better semantic matches for vague/lazy queries
- **Fallback:** On LLM failure, falls back to simple template method
- **Total time with structuring:** ~2-2.5s (structuring + embeddings + search)

#### When Query Structuring Helps Most

**Best for vague/atmospheric queries:**
- "Cosy Night In" → Expands to detailed comfort cinema descriptors
- "Dark and moody" → Expands to noir aesthetics and atmospheric elements
- "Feel-good Sunday morning" → Expands to light, uplifting narratives
- "Gritty urban drama" → Expands to crime, city settings, dark realism

**Less helpful for specific queries:**
- "Christopher Nolan sci-fi" → Already specific, structuring adds minimal value
- "Romantic comedy with Sandra Bullock" → Clear intent, template method works fine
- "Best movies of 2024" → Metadata-focused, structuring unnecessary

#### Example: "Cosy Night In"

**Without Structuring (Template Method):**
```javascript
{
  content: "Story: Cosy Night In. Overview: Cosy Night In. Themes: Cosy Night In",
  vibe: "Vibes: Cosy Night In. Tone: Cosy Night In. Tagline: Cosy Night In",
  metadata: "Genres: Cosy Night In. Type: Cosy Night In. Keywords: Cosy Night In"
}
```

**With Structuring (LLM Expansion):**
```javascript
{
  content: "Profile: Heartwarming story perfect for relaxing evening. Overview: Feel-good narrative about comfort and connection. Themes: comfort, warmth, togetherness, home. Story structure: Characters seeking peace in familiar settings. Keywords: cozy, relaxing, heartwarming",
  
  vibe: "Vibes: cozy, warm, comforting, relaxing, intimate. Tone: gentle, soothing. Pacing: slow-burn, contemplative. Tagline: Perfect for a quiet evening at home",
  
  metadata: "Genres: romance, comedy, drama, family. Director: Feel-good filmmakers. Certification: PG, PG-13. Countries: UK, US, France. Collection: Comfort cinema"
}
```

The structured version provides much richer semantic information that better matches database embeddings created from actual movie metadata.

#### Disabling Query Structuring

If you prefer faster searches without LLM query expansion:

1. Set `USE_QUERY_STRUCTURING=false` in `.env` (or omit the variable)
2. Restart server
3. Queries will use simple template repetition method

### Embedding Generation (server/embeddings.js:generateQueryEmbeddings)

Query is formatted based on `USE_QUERY_STRUCTURING` configuration:

**With Structuring Enabled:**
Uses LLM-expanded structured text (see Query Structuring section above)

**With Structuring Disabled (Default):**
Simple template repetition method:
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

**IMPORTANT:** All frontend changes MUST follow the Visual Design System below. This is mandatory for maintaining design consistency.

Refer to the **Visual Design System** section for complete guidance on colors, typography, spacing, and interactions.

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

## Visual Design System

**CRITICAL: Apply this design system to ALL frontend changes. No exceptions.**

### Foundation: Dark Luxury Cinema

A moody, premium dark interface with warm amber/gold accents. Think "private screening room" not "Netflix browse mode."

### Color System

| Element | Value | Usage |
|---------|-------|-------|
| Background | `#0a0a0f` | Deep warm black base |
| Surface low | `bg-white/[0.03]` | Subtle card backgrounds |
| Surface mid | `bg-white/[0.06]` | Hover states, elevated cards |
| Surface high | `bg-white/[0.10]` | Active/pressed states |
| Border subtle | `border-white/[0.05]` | Dividers, inactive borders |
| Border normal | `border-white/[0.08]` | Card borders |
| Border hover | `border-white/[0.15]` | Hover state borders |
| Text muted | `text-white/40` | Tertiary text, placeholders |
| Text secondary | `text-white/60` | Secondary labels |
| Text primary | `text-white/90` | Primary content (never pure white) |
| Accent | `amber-400` to `amber-600` | CTAs, active states |
| Accent glow | `shadow-[0_0_12px_rgba(245,158,11,0.15)]` | Active indicator glow |
| Active bg | `bg-amber-500/20` | Selected state background |
| Active text | `text-amber-300` | Selected state text |
| Active border | `border-amber-500/30` | Selected state border |

### Shape Language

```css
/* Pills & chips */
rounded-full or rounded-2xl

/* Cards */
rounded-[1.75rem] or rounded-[2rem]

/* Never use sharp corners - minimum rounded-lg */
```

### Surface Treatment (Glassmorphism-lite)

```css
/* Standard glass surface */
background: linear-gradient(to bottom-right, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
border: 1px solid rgba(255,255,255,0.08);

/* Tailwind equivalent */
className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]"

/* Heavy glass (main cards only) */
className="bg-black/50 backdrop-blur-2xl border border-white/[0.08]"
```

### Micro-interactions (Required)

```jsx
/* Hover - lift + scale */
whileHover={{ scale: 1.03, y: -2 }}

/* Tap - compress */
whileTap={{ scale: 0.97 }}

/* Transitions */
className="transition-all duration-200"

/* Focus - amber glow, never harsh outlines */
className="focus:border-amber-500/40 focus:shadow-[0_0_12px_rgba(245,158,11,0.15)]"
```

### Typography

| Font | Usage | Tailwind |
|------|-------|----------|
| Syne | Headings, display text | `font-heading` or `font-display` |
| Cabinet Grotesk | Body text, UI labels | `font-sans` |
| Instrument Serif | Logo/wordmark only | `font-serif` |

### Spacing Philosophy

- **Touch targets:** Minimum 44px (h-11, py-2.5 px-4)
- **Gaps:** `gap-2` tight groups, `gap-3` normal separation
- **Padding:** `px-4 py-2.5` for buttons, `px-5 py-5` for cards
- **Let elements breathe** - generous whitespace over density

### Mobile-First Patterns

```jsx
/* Horizontal scroll carousels (not wrapping grids on mobile) */
className="flex gap-2 overflow-x-auto scrollbar-none"
style={{ WebkitOverflowScrolling: 'touch' }}

/* Hide scrollbars */
className="scrollbar-none" /* defined in index.css */
```

### Component Patterns

**Pills/Chips (inactive):**
```jsx
className="px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap
  bg-gradient-to-br from-white/[0.06] to-white/[0.02]
  border border-white/[0.08] text-white/60
  hover:text-white/90 hover:border-white/15
  hover:from-white/[0.1] hover:to-white/[0.04]
  transition-all duration-200"
```

**Pills/Chips (active):**
```jsx
className="px-4 py-2.5 rounded-2xl text-sm font-medium
  bg-amber-500/20 text-amber-300
  border border-amber-500/30
  shadow-[0_0_12px_rgba(245,158,11,0.15)]"
```

**Primary Button:**
```jsx
className="h-11 px-6 rounded-full
  bg-gradient-to-br from-amber-400 to-amber-600
  text-white font-medium
  shadow-lg shadow-amber-500/25
  hover:shadow-amber-500/40
  transition-all duration-200"
```

**Glass Card:**
```jsx
className="rounded-[1.75rem] bg-black/50 backdrop-blur-2xl
  border border-white/[0.08]
  shadow-2xl shadow-black/50"
```

### Key Principles

1. **Depth through subtlety** - Use gradients and glows, not heavy drop shadows
2. **Warmth in darkness** - Amber accents prevent cold/sterile feeling
3. **Imply more content** - Horizontal scroll hints at discovery
4. **Premium restraint** - Few colors, consistent radii, quiet confidence
5. **Touch-first always** - Design for thumbs, enhance for cursors

### Copy Voice (for UI text)

Write like a friend texting movie recs at 2am:
- Internet-native vernacular ("hot girl summer energy", "doom scroll")
- Temporal anchoring ("That 3am can't-sleep melancholy")
- Emotional honesty ("need a good ugly cry" not "emotionally moving")
- Hyper-specific scenarios ("Heist crew with sexual tension")

**Avoid:** Corporate streaming language, generic genre labels, formal phrasing.

## Plan
At the end of each plan, give me a list of unresolved questions to answer. If any, make the questions extremely concise. Sacrifice grammar for the sake of concision.
If anything is unclear, make sure to ask clarifying questions.
