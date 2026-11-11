# upNext - AI-Powered Movie & TV Search

Describe a vibe ("that 3am can't-sleep melancholy", "like Severance but funnier") and get movie and TV picks, each with a one-line reason it fits. GPT-6 Luna picks the titles, and TMDB supplies posters, metadata, streaming providers and trailers.

## 🌟 Features

- **Natural-language search**: moods, plots, people, eras, comparisons, typos and other languages
- **"Why it's a match"**: every pick comes with a specific, model-written reason
- **More Like This / @mentions**: type `@title` or tap More Like This for similar titles
- **Rich details**: posters, synopsis, cast, director/creator, US streaming providers, YouTube trailers
- **Movie / TV filters**, Surprise Me, curated vibe categories, Cmd+K command palette
- **Responsive**: drawer on desktop, bottom sheet on mobile

## 🏗️ How It Works

```
query ──► GPT-6 Luna (structured JSON: title, year, kind, reason)
            │  up to 20 picks, ranked by fit
            ▼
        TMDB search ──► match each pick (title + year, tolerant of "12 Monkeys"/"Twelve Monkeys")
            ▼
        TMDB details ──► genres, cast, director, certification, runtime, providers
            ▼
        filter (type, year, excluded genres) ──► dedupe ──► interleave movies/TV ──► cache 30 min
```

Typical search takes 7-10s: about 6-9s for the model and about 1s for TMDB, which looks up every pick in parallel. Repeat searches return instantly from the cache.

### History

v1 used a Supabase/pgvector database of ~60k titles, each with three embeddings (content, vibe, metadata), searched with LLM-weighted multi-vector similarity and a custom reranker. The database has been retired; v2 swaps the retrieval layer for an LLM curator plus live TMDB data, keeping the same UI and API shape.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env   # add OPENAI_API_KEY and TMDB_TOKEN
npm run dev            # frontend :3001 + backend :5001
```

Get a TMDB "API Read Access Token" at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | required |
| `TMDB_TOKEN` | TMDB API Read Access Token | required |
| `OPENAI_MODEL` | Model that picks titles | `gpt-6-luna` |
| `REASONING_EFFORT` | `none` / `low` / `medium` / `high` / `xhigh` | `low` |
| `OPENAI_SERVICE_TIER` | `priority` (~1.5-2x faster, pricier) or `default` | `priority` |
| `SEARCH_CACHE_TTL_MINUTES` | In-memory result cache TTL | `30` |
| `PORT` | Backend port | `5001` |

## 🔧 API

| Endpoint | Description |
|----------|-------------|
| `POST /api/search` | `{ query, kindFilter?, minReleaseYear?, excludeGenres? }` → `{ query, model, results, count }` |
| `POST /api/similar` | `{ titleId, kind, kindFilter?, ... }` → titles similar to a TMDB title |
| `GET /api/titles/search?q=` | TMDB title autocomplete for `@mentions` |
| `GET /api/trailer/:tmdbId?mediaType=` | YouTube trailer from TMDB |
| `GET /api/recommendations` | TMDB trending titles |
| `GET /api/health` | Status + active model |

Each result has TMDB fields (`id`, `title`, `kind`, `release_date`, `overview`, `genres`, `director`, `cast`, `runtime_minutes`, `vote_average`, `certification`, `poster_path`, `backdrop_path`, `providers`) plus the model's `reason`.

```bash
curl -X POST http://localhost:5001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"slow burn sci-fi with big ideas","kindFilter":["movie"]}'
```

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS 3, Framer Motion, shadcn/Radix
- **Backend**: Node.js, Express, OpenAI SDK (structured outputs), TMDB API
- **Deploy**: Railway via `nixpacks.toml` (Express serves the built frontend)

## 📄 License

MIT

## 🙏 Acknowledgments

- OpenAI for GPT-6 Luna
- [TMDB](https://www.themoviedb.org/) for movie/TV metadata and images. This product uses the TMDB API but is not endorsed or certified by TMDB.
