import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";
import { searchTitles, checkConnection } from "./search.js";
import { fetchTrailer } from "./tmdb.js";
import { findSimilarTitles } from "./similar.js";

// ESM module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client for recommendations
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

const app = express();
const PORT = config.port;

// Server timeout configuration (60 seconds for vector searches)
const SERVER_TIMEOUT = 60000; // 60 seconds

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '10kb' }));

// Rate limiting for search/similar endpoints (OpenAI embedding calls = $$$)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Timeout middleware for long-running requests
app.use((req, res, next) => {
  req.setTimeout(SERVER_TIMEOUT, () => {
    if (!res.headersSent) {
      res.status(504).json({
        error: "Request timeout",
        message: "The request took too long to process. Please try again with a simpler query or fewer results.",
      });
    }
  });
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Helper function to select diverse titles by genre and release year
 */
function selectDiverseTitles(titles, count = 8) {
  if (!titles || titles.length === 0) return [];
  if (titles.length <= count) return titles;

  const selected = [];
  const genresSeen = new Set();
  const yearsSeen = new Set();

  // First pass: prioritize diversity
  for (const title of titles) {
    if (selected.length >= count) break;

    const genres = title.genres || [];
    const year = title.release_date
      ? new Date(title.release_date).getFullYear()
      : null;
    const hasNewGenre = genres.some((g) => !genresSeen.has(g));
    const hasNewYear = year && !yearsSeen.has(year);

    // Prefer titles that add genre or year diversity
    if (hasNewGenre || hasNewYear || selected.length < count / 2) {
      selected.push(title);
      genres.forEach((g) => genresSeen.add(g));
      if (year) yearsSeen.add(year);
    }
  }

  // Second pass: fill remaining slots with highest rated
  for (const title of titles) {
    if (selected.length >= count) break;
    if (!selected.includes(title)) {
      selected.push(title);
    }
  }

  return selected.slice(0, count);
}

/**
 * Title autocomplete endpoint
 * GET /api/titles/search?q=inception&limit=6
 * Returns titles matching search text for @mention feature
 */
app.get("/api/titles/search", async (req, res) => {
  try {
    const { q, limit = 6 } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Query parameter 'q' is required",
      });
    }

    const searchLimit = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 20);
    const searchTerm = `%${q.trim()}%`;

    console.log(`[TitleSearch] Searching for "${q}" (limit: ${searchLimit})`);

    const { data, error } = await supabase
      .from("titles")
      .select("id, title, poster_path, kind, release_date")
      .ilike("title", searchTerm)
      .not("poster_path", "is", null)
      .not("content_embedding", "is", null)
      .not("vibe_embedding", "is", null)
      .not("metadata_embedding", "is", null)
      .order("vote_average", { ascending: false })
      .limit(searchLimit);

    if (error) {
      console.error("[TitleSearch] Database error:", error);
      return res.status(500).json({
        error: "Database query failed",
        message: error.message,
      });
    }

    console.log(`[TitleSearch] Found ${data?.length || 0} results`);

    res.json({ results: data || [] });
  } catch (error) {
    console.error("[TitleSearch] Error:", error);
    res.status(500).json({
      error: "Failed to search titles",
      message: error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/health", async (req, res) => {
  const dbStatus = await checkConnection();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

/**
 * Recommendations endpoint
 * GET /api/recommendations
 * Returns 8 curated/popular titles for homepage
 */
app.get("/api/recommendations", async (req, res) => {
  try {
    console.log("[Recommendations] Fetching curated titles...");

    // Query for high-quality titles with posters
    // Only select fields needed for rendering movie cards and trailers
    const { data, error } = await supabase
      .from("titles")
      .select(`
        id,
        title,
        kind,
        release_date,
        overview,
        genres,
        vibes,
        themes,
        director,
        cast,
        vote_average,
        certification,
        runtime_minutes,
        poster_path,
        backdrop_path
      `)
      .not("poster_path", "is", null)
      .not("overview", "is", null)
      .contains("languages", ["en"])
      .limit(20);

    if (error) {
      console.error("[Recommendations] Database error:", error);
      return res.status(500).json({
        error: "Database query failed",
        message: error.message,
      });
    }

    // Select 8 diverse titles
    const recommendations = selectDiverseTitles(data, 20);

    console.log(`[Recommendations] Returning ${recommendations.length} titles`);

    res.json({
      results: recommendations,
      metadata: {
        count: recommendations.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Recommendations] Error:", error);
    res.status(500).json({
      error: "Failed to fetch recommendations",
      message: error.message,
    });
  }
});
app.post("/api/search", searchLimiter, async (req, res) => {
  try {
    const {
      query,
      matchCount = config.search.defaultMatchCount,
      matchThreshold = config.search.defaultMatchThreshold,
      kindFilter = null,
      minReleaseYear = null,
      excludeGenres = ['documentary', 'reality'],
    } = req.body;

    // Validate request
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Query must be a non-empty string",
      });
    }

    // Validate parameters
    if (matchCount < 1 || matchCount > 400) {
      return res.status(400).json({
        error: "Invalid request",
        message: "matchCount must be between 1 and 400",
      });
    }

    if (matchThreshold < 0 || matchThreshold > 1) {
      return res.status(400).json({
        error: "Invalid request",
        message: "matchThreshold must be between 0 and 1",
      });
    }

    // Validate kindFilter if provided
    if (kindFilter !== null && !Array.isArray(kindFilter)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "kindFilter must be an array or null",
      });
    }

    if (kindFilter && kindFilter.length > 0) {
      const validKinds = ['movie', 'tv'];
      const invalidKinds = kindFilter.filter(k => !validKinds.includes(k));
      if (invalidKinds.length > 0) {
        return res.status(400).json({
          error: "Invalid request",
          message: `kindFilter contains invalid values: ${invalidKinds.join(', ')}. Valid values are: ${validKinds.join(', ')}`,
        });
      }
    }

    // Validate minReleaseYear if provided
    if (minReleaseYear !== null && (typeof minReleaseYear !== 'number' || minReleaseYear < 1800 || minReleaseYear > 2100)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "minReleaseYear must be a number between 1800 and 2100",
      });
    }

    // Validate excludeGenres if provided
    if (excludeGenres !== null && !Array.isArray(excludeGenres)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "excludeGenres must be an array of genre strings",
      });
    }

    // Perform search - returns all 300 candidates sorted by VIBE score
    const startTime = Date.now();
    const results = await searchTitles(
      query.trim(),
      matchCount,
      matchThreshold,
      kindFilter,
      minReleaseYear,
      excludeGenres,
    );
    const duration = Date.now() - startTime;

    console.log(`[Search] Completed in ${duration}ms`);

    // Add performance metadata
    results.metadata = {
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    };

    res.json(results);
  } catch (error) {
    console.error("[API] Search error:", error);

    // Handle timeout errors specifically
    if (error.message && (error.message.includes("timeout") || error.message.includes("canceling statement"))) {
      return res.status(504).json({
        error: "Search timeout",
        message: "The search took too long to complete. Try reducing the number of results or simplifying your query.",
        timeout: true,
      });
    }

    // Return error response with fallback weights
    res.status(500).json({
      error: "Search failed",
      message: error.message,
      fallbackUsed: true,
      weights: { content: 0.4, vibe: 0.35, metadata: 0.25 },
    });
  }
});

/**
 * Similar titles endpoint
 * POST /api/similar
 * Body: { titleId, kindFilter?, minReleaseYear?, excludeGenres? }
 * Returns titles similar to the given title using vibe-heavy embedding search
 */
app.post("/api/similar", searchLimiter, async (req, res) => {
  try {
    const { titleId, kindFilter = null, minReleaseYear = null, excludeGenres = ['documentary', 'reality'] } = req.body;

    // Validate titleId (required, positive integer)
    const id = parseInt(titleId, 10);
    if (!titleId || isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "titleId must be a positive integer",
      });
    }

    // Validate kindFilter if provided
    if (kindFilter !== null && !Array.isArray(kindFilter)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "kindFilter must be an array or null",
      });
    }

    // Validate minReleaseYear if provided
    if (minReleaseYear !== null && (typeof minReleaseYear !== "number" || minReleaseYear < 1800 || minReleaseYear > 2100)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "minReleaseYear must be a number between 1800 and 2100",
      });
    }

    // Validate excludeGenres if provided
    if (excludeGenres !== null && !Array.isArray(excludeGenres)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "excludeGenres must be an array of genre strings",
      });
    }

    const startTime = Date.now();
    const result = await findSimilarTitles(id, kindFilter, minReleaseYear, excludeGenres);
    const duration = Date.now() - startTime;

    console.log(`[Similar] Completed in ${duration}ms`);

    res.json(result);
  } catch (error) {
    console.error("[API] Similar error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Not found",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Similar search failed",
      message: error.message,
    });
  }
});

/**
 * Trailer endpoint
 * GET /api/trailer/:tmdbId
 * Query params: mediaType (movie or tv)
 */
app.get("/api/trailer/:tmdbId", async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const { mediaType = "movie" } = req.query;

    // Validate TMDB ID
    const id = parseInt(tmdbId, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Invalid TMDB ID",
      });
    }

    // Check if TMDB token is configured
    if (!config.tmdbToken) {
      return res.status(503).json({
        error: "Service unavailable",
        message: "TMDB API not configured",
      });
    }

    // Fetch trailer
    const trailer = await fetchTrailer(id, mediaType);

    if (!trailer) {
      return res.status(404).json({
        error: "Not found",
        message: "No trailer found for this title",
      });
    }

    res.json(trailer);
  } catch (error) {
    console.error("[API] Trailer error:", error);
    res.status(500).json({
      error: "Failed to fetch trailer",
      message: error.message,
    });
  }
});

// ===== SERVE STATIC FRONTEND FILES (only in production) =====
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist");

  // Serve static files from Vite build output
  app.use(express.static(distPath));

  // SPA fallback: serve index.html for all non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // In development, catch-all for undefined routes
  app.use("*", (req, res) => {
    res.status(404).json({
      error: "Not found",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
  });
}

/**
 * Pre-warm vector indexes on startup
 * Runs a lightweight dummy search to traverse HNSW graphs and pull nodes into OS page cache
 */
async function prewarmVectorIndexes() {
  try {
    console.log('🔥 Pre-warming vector indexes...');
    const startTime = Date.now();

    // Zero vector triggers HNSW traversal on all 3 indexes without needing real embeddings
    const zeroVector = new Array(1536).fill(0);

    const { error } = await supabase.rpc('match_titles_multi', {
      query_content_embedding: zeroVector,
      query_vibe_embedding: zeroVector,
      query_metadata_embedding: zeroVector,
      match_count: 10,
      match_threshold: 0.0,
    });

    if (error) {
      console.warn('⚠️  Pre-warming failed (non-critical):', error.message);
      return;
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Vector indexes pre-warmed in ${duration}ms (dummy search on 3 HNSW indexes)`);
  } catch (error) {
    console.warn('⚠️  Pre-warming failed (non-critical):', error.message);
  }
}

// Start server
const server = app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/search`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV === "production") {
    console.log(`🎨 Serving static frontend from dist/`);
  }
  console.log(`⏱️  Server timeout: ${SERVER_TIMEOUT}ms`);
  console.log();
  
  // Pre-warm vector indexes (non-blocking)
  await prewarmVectorIndexes();
  console.log(`🎯 Server ready to accept requests\n`);
});

// Set server-level timeout
server.setTimeout(SERVER_TIMEOUT);
server.keepAliveTimeout = SERVER_TIMEOUT;
server.headersTimeout = SERVER_TIMEOUT + 1000; // Slightly higher than keepAliveTimeout

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received, shutting down gracefully");
  process.exit(0);
});
