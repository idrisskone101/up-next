import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { searchTitles, findSimilarTitles } from "./search.js";
import { fetchTrailer, searchTitlesByName, getTrending } from "./tmdb.js";

// ESM module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Behind Railway's proxy: use client IP from X-Forwarded-For so rate limits are per user
app.set("trust proxy", 1);
const PORT = config.port;

// Server timeout configuration (60 seconds for LLM searches)
const SERVER_TIMEOUT = 60000; // 60 seconds

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable for now to avoid breaking embedding
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '10kb' }));

// Rate limiting for search/similar endpoints (LLM calls = $$$)
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
    const results = await searchTitlesByName(q.trim(), searchLimit);
    res.json({ results });
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
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    model: config.openaiModel,
  });
});

/**
 * Recommendations endpoint
 * GET /api/recommendations
 * Returns TMDB trending titles for homepage
 */
app.get("/api/recommendations", async (req, res) => {
  try {
    const results = await getTrending();
    res.json({
      results,
      metadata: {
        count: results.length,
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

    if (query.length > 500) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Query must be 500 characters or fewer",
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

    const startTime = Date.now();
    const results = await searchTitles(query.trim(), { kindFilter, minReleaseYear, excludeGenres });
    const duration = Date.now() - startTime;

    console.log(`[Search] Completed in ${duration}ms`);

    res.json({
      ...results,
      metadata: {
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Search error:", error);

    if (error.message?.toLowerCase().includes("timeout")) {
      return res.status(504).json({
        error: "Search timeout",
        message: "The search took too long to complete. Try reducing the number of results or simplifying your query.",
        timeout: true,
      });
    }

    res.status(500).json({
      error: "Search failed",
      message: error.message,
    });
  }
});

/**
 * Similar titles endpoint
 * POST /api/similar
 * Body: { titleId, kind, kindFilter?, minReleaseYear?, excludeGenres? }
 * Returns LLM-suggested titles similar to the given TMDB title
 */
app.post("/api/similar", searchLimiter, async (req, res) => {
  try {
    const { titleId, kind = "movie", kindFilter = null, minReleaseYear = null, excludeGenres = ['documentary', 'reality'] } = req.body;

    // Validate titleId (required, positive integer)
    const id = parseInt(titleId, 10);
    if (!titleId || isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "titleId must be a positive integer",
      });
    }

    if (kind !== "movie" && kind !== "tv") {
      return res.status(400).json({
        error: "Invalid request",
        message: 'kind must be "movie" or "tv"',
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
    const result = await findSimilarTitles(id, kind, { kindFilter, minReleaseYear, excludeGenres });
    const duration = Date.now() - startTime;

    console.log(`[Similar] Completed in ${duration}ms`);

    res.json(result);
  } catch (error) {
    console.error("[API] Similar error:", error);

    if (error.message.includes("404")) {
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
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/search`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV === "production") {
    console.log(`🎨 Serving static frontend from dist/`);
  }
  console.log(`⏱️  Server timeout: ${SERVER_TIMEOUT}ms\n`);
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
