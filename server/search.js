import { createClient } from "@supabase/supabase-js";
import {
  analyzeQueryIntent,
  generateEmbeddingsFromStructured,
  structureQuery,
  createFallbackStructuredText,
  getFixedWeights,
} from "./embeddings.js";
import { rerankResults } from "./reranker.js";
import { detectQueryIntent, filterVibeConflicts, getIntentExclusions } from "./vibeConflict.js";
import { config } from "./config.js";
import {
  embeddingCache,
  searchCache,
  weightCache,
  structuredQueryCache,
  getSearchCacheKey,
  normalizeQuery,
} from "./cache.js";

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

/**
 * Main search handler - orchestrates query analysis, embedding generation, and database search
 * Uses single embedding with match_titles_multi RPC for efficient weighted search
 * Supports both fixed weights (fast) and dynamic LLM-based weights (slower but adaptive)
 * Includes re-ranking to enhance results with quality signals
 * Returns all 150 candidates sorted by VIBE score - frontend handles pagination
 *
 * @param {string} query - The user's search query
 * @param {number} matchCount - Ignored, always fetches 150 candidates
 * @param {number} matchThreshold - DEPRECATED: No longer used by RPC (kept for backward compatibility)
 * @param {string[]|null} kindFilter - Filter by media type: ['movie'], ['tv'], or null for both
 * @returns {Promise<Object>} All search results sorted by vibe_score descending
 */
export async function searchTitles(
  query,
  matchCount = config.search.defaultMatchCount,
  matchThreshold = config.search.defaultMatchThreshold,
  kindFilter = null,
  minReleaseYear = null,
  excludeGenres = ['documentary', 'reality'],
) {
  try {
    console.log('[Search] Query: "' + query + '"');
    const searchStartTime = Date.now();
    const normalizedQuery = normalizeQuery(query);

    // Performance tracking
    const timings = {
      llm: 0,
      embedding: 0,
      database: 0,
      reranking: 0,
      total: 0
    };

    // Check full search cache first (instant response for repeated queries)
    if (config.enableSearchCache) {
      const cacheKey = getSearchCacheKey(query, matchThreshold, kindFilter, minReleaseYear, excludeGenres);
      const cachedResult = searchCache.get(cacheKey);
      if (cachedResult) {
        console.log(`[Search] Full cache HIT - returning in ${Date.now() - searchStartTime}ms`);
        return cachedResult;
      }
    }

    // Step 1: Get weights and structured query IN PARALLEL
    let weights;
    let weightSource;
    let structuredText;

    // Check caches for weights and structured query
    const cachedWeights = config.useDynamicWeights ? weightCache.get(normalizedQuery) : null;
    const cachedStructured = config.useQueryStructuring ? structuredQueryCache.get(normalizedQuery) : null;

    // Build list of parallel operations needed
    const parallelOps = [];

    // Weight analysis (if dynamic and not cached)
    if (config.useDynamicWeights) {
      if (cachedWeights) {
        weights = cachedWeights;
        weightSource = "dynamic (cached)";
      } else {
        parallelOps.push(
          analyzeQueryIntent(query).then(w => {
            weightCache.set(normalizedQuery, w);
            return { type: "weights", value: w };
          })
        );
      }
    } else {
      weights = getFixedWeights();
      weightSource = "fixed";
    }

    // Query structuring (if enabled and not cached)
    if (config.useQueryStructuring) {
      if (cachedStructured) {
        structuredText = cachedStructured;
        console.log("[Search] Structured query cache HIT");
      } else {
        parallelOps.push(
          structureQuery(query)
            .then(s => {
              structuredQueryCache.set(normalizedQuery, s);
              return { type: "structured", value: s };
            })
            .catch(err => {
              console.warn("[Search] Query structuring failed:", err.message);
              return { type: "structured", value: createFallbackStructuredText(query) };
            })
        );
      }
    } else {
      structuredText = createFallbackStructuredText(query);
    }

    // Run parallel operations
    if (parallelOps.length > 0) {
      const llmStartTime = Date.now();
      console.log(`[Search] Running ${parallelOps.length} LLM operation(s) in parallel...`);
      const results = await Promise.all(parallelOps);
      timings.llm = Date.now() - llmStartTime;
      console.log(`[Search] LLM operations completed in ${timings.llm}ms`);
      for (const result of results) {
        if (result.type === "weights") {
          weights = result.value;
          weightSource = "dynamic";
        } else if (result.type === "structured") {
          structuredText = result.value;
        }
      }
    }

    console.log(
      "[Search] Weights (" + weightSource + "): content=" + weights.content.toFixed(2) + ", vibe=" + weights.vibe.toFixed(2) + ", metadata=" + weights.metadata.toFixed(2),
    );

    // Step 2: Generate embeddings from structured text (check cache first)
    let embeddings = embeddingCache.get(normalizedQuery);
    if (embeddings) {
      console.log("[Search] Embedding cache HIT");
    } else {
      const embeddingStartTime = Date.now();
      console.log("[Search] Generating embeddings from structured text...");
      embeddings = await generateEmbeddingsFromStructured(structuredText);
      timings.embedding = Date.now() - embeddingStartTime;
      embeddingCache.set(normalizedQuery, embeddings);
      console.log(`[Search] Embeddings generated and cached in ${timings.embedding}ms`);
    }

    // Step 3: Call match_titles_multi RPC with three structured embeddings
    // Fetch 150 candidates — RPC uses LEAST(match_count * 2, 250) per embedding
    // Post-migration optimization: ~44% fewer HNSW traversals (250 vs 450 per embedding)
    const dbMatchCount = 150;

    console.log("[Search] Calling match_titles_multi RPC with 3 embeddings...");
    if (kindFilter) {
      console.log("[Search] Filtering by kind: " + kindFilter.join(", "));
    }
    if (minReleaseYear) {
      console.log("[Search] Filtering by min release year: " + minReleaseYear);
    }
    if (excludeGenres) {
      console.log("[Search] Excluding genres: " + excludeGenres.join(", "));
    }
    console.log("[Search] Fetching " + dbMatchCount + " candidates for frontend pagination");

    const dbStartTime = Date.now();

    const { data, error } = await supabase.rpc("match_titles_multi", {
      query_content_embedding: embeddings.content,
      query_vibe_embedding: embeddings.vibe,
      query_metadata_embedding: embeddings.metadata,
      weight_content: weights.content,
      weight_vibe: weights.vibe,
      weight_metadata: weights.metadata,
      weight_popularity: config.fixedWeights.popularity,
      match_threshold: matchThreshold, // DEPRECATED: RPC ignores this, kept for backward compatibility
      match_count: dbMatchCount,
      filter_kind: kindFilter,
      min_release_year: minReleaseYear,
      exclude_genres: excludeGenres,
    });

    if (error) {
      console.error("[Search] Supabase error:", error);
      throw new Error("Database search failed: " + error.message);
    }

    timings.database = Date.now() - dbStartTime;
    console.log("[Search] RPC completed in " + timings.database + "ms, returned " + (data?.length || 0) + " results");

    // Step 4: Process results (rename movie_cast to cast for frontend compatibility)
    let results = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      kind: row.kind,
      release_date: row.release_date,
      overview: row.overview,
      genres: row.genres,
      director: row.director,
      vibes: row.vibes,
      themes: row.themes,
      keywords: row.keywords,
      runtime_minutes: row.runtime_minutes,
      vote_average: row.vote_average,
      certification: row.certification,
      poster_path: row.poster_path,
      backdrop_path: row.backdrop_path,
      cast: row.movie_cast,
      languages: row.languages,
      production_countries: row.production_countries,
      content_score: row.content_score,
      vibe_score: row.vibe_score,
      metadata_score: row.metadata_score,
      combined_score: row.combined_score,
      strongest_signal: row.strongest_signal,
      providers: row.providers,
    }));

    console.log("[Search] Found " + results.length + " results from database");

    // Filter non-Latin-script titles without English language data (CJK, Arabic, Cyrillic, Thai, Devanagari)
    const beforeLangFilter = results.length;
    const NON_LATIN_RE = /[\u0400-\u04ff\u0600-\u06ff\u0900-\u097f\u0e00-\u0e7f\u3000-\u9fff\uac00-\ud7af]/;
    results = results.filter(r => {
      if (NON_LATIN_RE.test(r.title)) {
        return (r.languages || []).includes('en');
      }
      return true;
    });
    if (results.length < beforeLangFilter) {
      console.log(`[Search] Language filter: removed ${beforeLangFilter - results.length} non-Latin titles`);
    }

    // Apply combined_score floor to remove noise
    const MIN_COMBINED_SCORE = 0.33;
    const beforeScoreFilter = results.length;
    results = results.filter(r => r.combined_score >= MIN_COMBINED_SCORE);
    if (results.length < beforeScoreFilter) {
      console.log(`[Search] Score floor: removed ${beforeScoreFilter - results.length} results below ${MIN_COMBINED_SCORE}`);
    }

    // Cap results to prevent excessive pagination with low-quality tail
    const MAX_RESULTS = 150;
    if (results.length > MAX_RESULTS) {
      console.log(`[Search] Capping results from ${results.length} to ${MAX_RESULTS}`);
      results = results.slice(0, MAX_RESULTS);
    }

    // Apply vibe conflict filter if enabled (excludes tonally incompatible results)
    let queryIntent = null;
    if (config.enableVibeConflictFilter) {
      queryIntent = detectQueryIntent(query);
      if (queryIntent) {
        const beforeVibeFilter = results.length;
        results = filterVibeConflicts(results, queryIntent);
        const excluded = beforeVibeFilter - results.length;
        const exclusions = getIntentExclusions(queryIntent);
        console.log(`[Search] Vibe filter: "${queryIntent}" intent detected, excluded ${excluded} titles (rules: ${JSON.stringify(exclusions)})`);
      } else {
        console.log("[Search] Vibe filter: No intent detected, skipping");
      }
    } else {
      console.log("[Search] Vibe filter: DISABLED in config");
    }

    // Step 5: Re-rank results if enabled
    let finalResults = results;
    let rerankingApplied = false;

    if (config.enableReranking && finalResults.length > 0) {
      try {
        const rerankStartTime = Date.now();
        finalResults = rerankResults(finalResults, query, config);
        timings.reranking = Date.now() - rerankStartTime;
        rerankingApplied = true;
        console.log("[Search] Re-ranking completed for " + finalResults.length + " results (" + timings.reranking + "ms)");
      } catch (rerankError) {
        console.error("[Search] Re-ranking failed, using original results:", rerankError);
        finalResults = results;
      }
    } else if (!config.enableReranking) {
      console.log("[Search] Re-ranking DISABLED in config");
    }

    timings.total = Date.now() - searchStartTime;

    // Log detailed timing breakdown for performance analysis
    console.log("[Search] ===== PERFORMANCE BREAKDOWN =====");
    console.log(`[Search] Total: ${timings.total}ms`);
    console.log(`[Search]   ├─ LLM ops (weights/structuring): ${timings.llm}ms (${((timings.llm/timings.total)*100).toFixed(1)}%)`);
    console.log(`[Search]   ├─ Embedding generation: ${timings.embedding}ms (${((timings.embedding/timings.total)*100).toFixed(1)}%)`);
    console.log(`[Search]   ├─ Database RPC: ${timings.database}ms (${((timings.database/timings.total)*100).toFixed(1)}%)`);
    console.log(`[Search]   ├─ Re-ranking: ${timings.reranking}ms (${((timings.reranking/timings.total)*100).toFixed(1)}%)`);
    const overhead = timings.total - timings.llm - timings.embedding - timings.database - timings.reranking;
    console.log(`[Search]   └─ Other (filtering/processing): ${overhead}ms (${((overhead/timings.total)*100).toFixed(1)}%)`);
    console.log("[Search] ===================================");

    // Return all 150 candidates - frontend handles pagination
    const totalResults = finalResults.length;
    console.log("[Search] Returning all " + totalResults + " candidates for frontend pagination");

    // Step 7: Build and cache result
    const result = {
      query,
      weights: {
        content: weights.content,
        vibe: weights.vibe,
        metadata: weights.metadata,
      },
      weightReasoning: weights.reasoning,
      weightSource,
      results: finalResults,
      count: finalResults.length,
      totalCount: totalResults,
      rerankingApplied,
    };

    // Cache the full search result
    if (config.enableSearchCache) {
      const cacheKey = getSearchCacheKey(query, matchThreshold, kindFilter, minReleaseYear, excludeGenres);
      searchCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error("[Search] Error:", error);
    throw error;
  }
}

/**
 * Health check for Supabase connection
 */
export async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from("titles")
      .select("count")
      .limit(1);

    if (error) throw error;
    return { connected: true };
  } catch (error) {
    console.error("[Health] Supabase connection failed:", error);
    return { connected: false, error: error.message };
  }
}
