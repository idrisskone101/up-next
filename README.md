# upNext - AI-Powered Movie & TV Search

A beautiful, semantic search application for movies and TV shows using multi-embedding vector search with LLM-powered dynamic weight adjustment.

## 🌟 Features

- **Multi-Embedding Semantic Search**: Uses 3 separate embeddings (content, vibe, metadata) for nuanced search results
- **LLM-Powered Weight Adjustment**: GPT-4o-mini analyzes queries to determine optimal embedding weights
- **Apple-Inspired UI**: Clean, minimal design with glass-morphism effects and smooth animations
- **Responsive Design**: Works beautifully on mobile, tablet, and desktop
- **Rich Movie Details**: View posters, scores, genres, vibes, themes, cast, and more
- **Real-time Score Breakdown**: See how each embedding type contributed to the match

## 🏗️ Architecture

### Backend (Express.js - Port 5001)
- Query analysis using GPT-4o-mini
- Embedding generation with OpenAI text-embedding-3-small
- Multi-vector search via Supabase PostgreSQL with pgvector
- RESTful API endpoints

### Frontend (React + Vite - Port 3001)
- Modern React with hooks
- Tailwind CSS for styling
- Responsive grid layouts
- Modal-based detail views

### Database (Supabase)
- PostgreSQL with pgvector extension
- 990 movies/TV shows with 3 embeddings each
- Custom RPC function `match_titles_multi()`

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (database already set up)
- OpenAI API key

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Your `.env` file should already contain:

```bash
# Supabase
SUPABASE_URL=REDACTED
SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Server
PORT=5001
```

### 3. Start Development Servers

Start both frontend and backend:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev:client
```

### 4. Open Your Browser

Navigate to [http://localhost:3001](http://localhost:3001)

## 🎯 How It Works

### Query Processing Flow

1. **User submits query** → Frontend sends to `/api/search`
2. **LLM analyzes intent** → Determines optimal weights (content/vibe/metadata)
3. **Generate embeddings** → Creates 3 separate query embeddings
4. **Database search** → Calls Supabase RPC with weighted multi-vector search
5. **Return results** → Sorted by combined similarity score

### Example Weight Distributions

- **"cozy romantic comedies"** → Vibe: 50%, Metadata: 25%, Content: 25%
- **"Christopher Nolan films"** → Metadata: 70%, Content: 20%, Vibe: 10%
- **"time travel paradox story"** → Content: 60%, Metadata: 25%, Vibe: 15%
- **"dark revenge thriller"** → Vibe: 45%, Content: 35%, Metadata: 20%

## 📁 Project Structure

```
upNext/
├── server/
│   ├── config.js          # Environment config
│   ├── embeddings.js      # OpenAI integration
│   ├── search.js          # Supabase queries
│   └── index.js           # Express server
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── MovieCard.jsx
│   │   ├── ResultsGrid.jsx
│   │   ├── MovieModal.jsx
│   │   └── ScoreBreakdown.jsx
│   ├── hooks/
│   │   └── useSearch.js
│   ├── lib/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎨 UI Components

### SearchBar
- Auto-focus on page load
- Clear button when text is present
- Loading state with spinner
- Gradient submit button

### MovieCard
- Poster image with fallback
- Combined score badge
- Genre and vibe tags
- Truncated overview
- Hover animations

### MovieModal
- Full movie details
- Backdrop image
- Cast and crew
- Score breakdown visualization
- Keyboard navigation (ESC to close)

### ScoreBreakdown
- Combined score progress bar
- Individual scores (content/vibe/metadata)
- Strongest signal indicator
- Color-coded visualization

## 🔧 API Endpoints

### POST /api/search

Search for movies and TV shows.

**Request:**
```json
{
  "query": "cozy romantic comedies",
  "matchCount": 10,
  "matchThreshold": 0.3
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
  "weightReasoning": "Query emphasizes mood/atmosphere...",
  "results": [...],
  "count": 10,
  "metadata": {
    "duration_ms": 4536,
    "timestamp": "2025-10-23T03:56:51.121Z"
  }
}
```

### GET /api/health

Check server and database health.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T03:56:41.285Z",
  "database": {
    "connected": true
  }
}
```

## 🧪 Testing

### Test Backend API

```bash
curl -X POST http://localhost:5001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"cozy romantic comedies","matchCount":5}'
```

### Example Search Queries

Try these in the UI to see different weight distributions:

- "cozy romantic comedies" (vibe-focused)
- "Christopher Nolan films" (metadata-focused)
- "time travel paradox story" (content-focused)
- "dark revenge thriller" (balanced)
- "heartwarming coming-of-age" (mixed)

## 🎯 Performance

- Average search time: **3-5 seconds**
  - LLM analysis: ~1-2s
  - Embedding generation: ~1s
  - Database search: ~0.5s
- No client-side re-ranking (search results are final)
- Concurrent request handling

## 🚢 Building for Production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite 6
- Tailwind CSS 3
- Modern JavaScript (ES modules)

### Backend
- Node.js
- Express.js
- OpenAI API (GPT-4o-mini + text-embedding-3-small)
- Supabase (PostgreSQL + pgvector)

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `PORT` | Backend server port | Optional (default: 5001) |

## 🤝 Contributing

This is a demonstration project showcasing multi-embedding semantic search with LLM-powered weight adjustment.

## 📄 License

MIT

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini and text-embedding-3-small
- Supabase for PostgreSQL + pgvector hosting
- TMDB for movie/TV metadata and images

---

Built with ❤️ using AI-powered semantic search
