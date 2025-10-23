import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { searchTitles, checkConnection } from "./search.js";

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
 * Search endpoint
 * POST /api/search
 * Body: { query: string, matchCount?: number, matchThreshold?: number }
 */
app.post("/api/search", async (req, res) => {
  try {
    const { query, matchCount = 10, matchThreshold = 0.3 } = req.body;

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

    // Perform search
    const startTime = Date.now();
    const results = await searchTitles(
      query.trim(),
      matchCount,
      matchThreshold,
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
 * Catch-all for undefined routes
 */
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/search`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
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
