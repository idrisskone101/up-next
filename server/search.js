import { createClient } from "@supabase/supabase-js";
import {
  analyzeQueryIntent,
  generateQueryEmbedding,
  getFixedWeights,
} from "./embeddings.js";
import { rerankResults } from "./reranker.js";
import { detectQueryIntent, filterVibeConflicts, getIntentExclusions } from "./vibeConflict.js";
import { config } from "./config.js";

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

/**
 * Helper for case-insensitive language matching
 * Handles both ISO codes ('en', 'ja') and full names ('English', 'Japanese')
 * @param {string[]|null} languages - Array of language codes/names
 * @param {...string} codes - Language codes to check for
 * @returns {boolean} - True if any code matches
 */
function hasLanguage(languages, ...codes) {
  if (!languages) return false;
  const normalized = languages.map(l => l.toLowerCase());
  return codes.some(code => normalized.includes(code.toLowerCase()));
}

/**
 * Check if content is acceptable based on language and production country
 * @param {Object} title - Title object with languages, production_countries, and genres
 * @returns {boolean} - True if content should be included
 */
function isAcceptableContent(title) {
  const ENGLISH_SPEAKING_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'NZ', 'IE'];

  // Check if English language (handles 'en', 'English')
  if (hasLanguage(title.languages, 'en', 'english')) return true;

  // Check if from English-speaking country
  if (title.production_countries?.some(c => ENGLISH_SPEAKING_COUNTRIES.includes(c))) {
    return true;
  }

  // Check if Japanese anime (handles 'ja'/'Japanese' + 'animation'/'Animation')
  const isJapanese = hasLanguage(title.languages, 'ja', 'japanese');
  const isAnimation = title.genres?.some(g => g.toLowerCase() === 'animation');
  if (isJapanese && isAnimation) return true;

  return false;
}


/**
 * Main search handler - orchestrates query analysis, embedding generation, and database search
 * Uses single embedding with match_titles_multi RPC for efficient weighted search
 * Supports both fixed weights (fast) and dynamic LLM-based weights (slower but adaptive)
 * Includes re-ranking to enhance results with quality signals
 * Supports pagination with page and pageSize parameters
 *
 * @param {string} query - The user's search query
 * @param {number} matchCount - Number of results to fetch from database (default: from config)
 * @param {number} matchThreshold - Minimum similarity score (default: from config)
 * @param {string[]|null} kindFilter - Filter by media type: ['movie'], ['tv'], or null for both
 * @param {number} page - Page number (1-indexed, default: 1)
 * @param {number} pageSize - Number of results per page (default: 20)
 * @returns {Promise<Object>} Search results with weights and reasoning
 */
export async function searchTitles(
  query,
  matchCount = config.search.defaultMatchCount,
  matchThreshold = config.search.defaultMatchThreshold,
  kindFilter = null,
  page = 1,
  pageSize = 20,
) {
  try {
    console.log('[Search] Query: "' + query + '"');
    const searchStartTime = Date.now();

    // Step 1: Get weights (either fixed or dynamic based on config)
    let weights;
    let weightSource;

    if (config.useDynamicWeights) {
      console.log("[Search] Using DYNAMIC weights (LLM analysis)...");
      weights = await analyzeQueryIntent(query);
      weightSource = "dynamic";
    } else {
      console.log("[Search] Using FIXED weights from config...");
      weights = getFixedWeights();
      weightSource = "fixed";
    }

    console.log(
      "[Search] Weights (" + weightSource + "): content=" + weights.content.toFixed(2) + ", vibe=" + weights.vibe.toFixed(2) + ", metadata=" + weights.metadata.toFixed(2),
    );

    // Step 2: Generate single embedding for the query
    console.log("[Search] Generating embedding...");
    const embedding = await generateQueryEmbedding(query);
    console.log("[Search] Embedding generated successfully");

    // Step 3: Call match_titles_multi RPC with single embedding passed to all three vectors
    // Request 25% more to compensate for ~20% filter loss
    const FILTER_BUFFER = 1.25;
    const resultsNeeded = page * pageSize;
    const bufferedCount = Math.ceil(matchCount * FILTER_BUFFER);
    const dbMatchCount = Math.min(Math.max(bufferedCount, resultsNeeded + 1), 200);

    console.log("[Search] Calling match_titles_multi RPC...");
    if (kindFilter) {
      console.log("[Search] Filtering by kind: " + kindFilter.join(", "));
    }
    console.log("[Search] Pagination: page=" + page + ", pageSize=" + pageSize + ", fetching " + dbMatchCount + " results (buffered from " + matchCount + ")");

    const dbStartTime = Date.now();

    const { data, error } = await supabase.rpc("match_titles_multi", {
      query_content_embedding: embedding,
      query_vibe_embedding: embedding,
      query_metadata_embedding: embedding,
      weight_content: weights.content,
      weight_vibe: weights.vibe,
      weight_metadata: weights.metadata,
      weight_popularity: 0, // Let reranker handle popularity
      match_threshold: matchThreshold,
      match_count: dbMatchCount,
      filter_kind: kindFilter,
    });

    if (error) {
      console.error("[Search] Supabase error:", error);
      throw new Error("Database search failed: " + error.message);
    }

    const dbEndTime = Date.now();
    console.log("[Search] RPC completed in " + (dbEndTime - dbStartTime) + "ms, returned " + (data?.length || 0) + " results");

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
    }));

    console.log("[Search] Found " + results.length + " results from database");

    // Apply language filter (English, English-speaking countries, or anime)
    const beforeFilter = results.length;
    results = results.filter(title => isAcceptableContent(title));
    console.log("[Search] Language filter: " + beforeFilter + " -> " + results.length + " results");

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
        const rerankEndTime = Date.now();
        rerankingApplied = true;
        console.log("[Search] Re-ranking completed for " + finalResults.length + " results (" + (rerankEndTime - rerankStartTime) + "ms)");
      } catch (rerankError) {
        console.error("[Search] Re-ranking failed, using original results:", rerankError);
        finalResults = results;
      }
    } else if (!config.enableReranking) {
      console.log("[Search] Re-ranking DISABLED in config");
    }

    const searchEndTime = Date.now();
    console.log("[Search] Total search time: " + (searchEndTime - searchStartTime) + "ms");

    // Step 6: Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = finalResults.slice(startIndex, endIndex);
    const hasMore = paginatedResults.length === pageSize && finalResults.length > endIndex;
    const totalResults = finalResults.length;
    const totalPages = Math.ceil(totalResults / pageSize);

    console.log("[Search] Pagination: Returning page " + page + " (" + paginatedResults.length + " results, hasMore: " + hasMore + ", fetched " + totalResults + " total)");

    // Step 7: Return formatted results with pagination metadata
    return {
      query,
      weights: {
        content: weights.content,
        vibe: weights.vibe,
        metadata: weights.metadata,
      },
      weightReasoning: weights.reasoning,
      weightSource,
      results: paginatedResults,
      count: paginatedResults.length,
      totalCount: totalResults,
      page,
      pageSize,
      totalPages,
      hasMore,
      rerankingApplied,
    };
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
