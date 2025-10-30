import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";
import { searchTitles, checkConnection } from "./search.js";
import { fetchTrailer } from "./tmdb.js";

// ESM module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client for recommendations
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());

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
      .gte("vote_average", 6.0)
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
app.post("/api/search", async (req, res) => {
  try {
    const { query, matchCount = config.search.defaultMatchCount, matchThreshold = config.search.defaultMatchThreshold, kindFilter = null } = req.body;

    // Validate request
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Query must be a non-empty string",
      });
    }

    // Validate parameters
    if (matchCount < 1 || matchCount > 100) {
      return res.status(400).json({
        error: "Invalid request",
        message: "matchCount must be between 1 and 100",
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

    // Perform search
    const startTime = Date.now();
    const results = await searchTitles(
      query.trim(),
      matchCount,
      matchThreshold,
      kindFilter,
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

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/search`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV === "production") {
    console.log(`🎨 Serving static frontend from dist/`);
  }
  console.log();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received, shutting down gracefully");
  process.exit(0);
});
