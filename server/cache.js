import { config } from "./config.js";

/**
 * Simple in-memory cache with TTL support
 * Stores entries as { value, expiry } pairs
 */
class TTLCache {
  constructor(ttlMinutes, name = "cache") {
    this.cache = new Map();
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.name = name;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] ${this.name} HIT: "${key.substring(0, 50)}..."`);
    return entry.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs,
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Clean expired entries (call periodically if needed)
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Embedding cache: query → { content, vibe, metadata } embeddings
// TTL from config (default 30 min)
export const embeddingCache = new TTLCache(
  config.embeddingCacheTtlMinutes || 30,
  "embeddings"
);

// Full search results cache: query+params → search results
// TTL from config (default 5 min)
export const searchCache = new TTLCache(
  config.searchCacheTtlMinutes || 5,
  "search"
);

// Weight analysis cache: query → weights
// Same TTL as embeddings since weights are query-dependent
export const weightCache = new TTLCache(
  config.embeddingCacheTtlMinutes || 30,
  "weights"
);

// Structured query cache: query → structured text
export const structuredQueryCache = new TTLCache(
  config.embeddingCacheTtlMinutes || 30,
  "structured"
);

/**
 * Generate cache key for search results
 * Includes all parameters that affect results
 */
export function getSearchCacheKey(query, matchThreshold, kindFilter, minReleaseYear = null, excludeGenres = null) {
  const normalizedQuery = query.toLowerCase().trim();
  const filterStr = kindFilter ? kindFilter.sort().join(",") : "all";
  const yearStr = minReleaseYear || "any";
  const genreStr = excludeGenres ? excludeGenres.sort().join(",") : "none";
  return `${normalizedQuery}:${matchThreshold}:${filterStr}:${yearStr}:${genreStr}`;
}

/**
 * Normalize query for embedding/weight cache keys
 */
export function normalizeQuery(query) {
  return query.toLowerCase().trim();
}

// Prune expired entries every 5 minutes
setInterval(() => {
  embeddingCache.prune();
  searchCache.prune();
  weightCache.prune();
  structuredQueryCache.prune();
}, 5 * 60 * 1000);

console.log(`[Cache] Initialized - embeddings: ${config.embeddingCacheTtlMinutes || 30}min TTL, search: ${config.searchCacheTtlMinutes || 5}min TTL`);
