import { createClient } from "@supabase/supabase-js";
import {
  analyzeQueryIntent,
  generateQueryEmbeddings,
  getFixedWeights,
} from "./embeddings.js";
import { rerankResults } from "./reranker.js";
import { detectQueryIntent, filterVibeConflicts, getIntentExclusions } from "./vibeConflict.js";
import { config } from "./config.js";

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

/**
 * Main search handler - orchestrates query analysis, embedding generation, and database search
 * Uses single embedding with match_titles_multi RPC for efficient weighted search
 * Supports both fixed weights (fast) and dynamic LLM-based weights (slower but adaptive)
 * Includes re-ranking to enhance results with quality signals
 * Returns all 300 candidates sorted by VIBE score - frontend handles pagination
 *
 * @param {string} query - The user's search query
 * @param {number} matchCount - Ignored, always fetches 300 candidates
 * @param {number} matchThreshold - Minimum similarity score (default: from config)
 * @param {string[]|null} kindFilter - Filter by media type: ['movie'], ['tv'], or null for both
 * @returns {Promise<Object>} All search results sorted by vibe_score descending
 */
export async function searchTitles(
  query,
  matchCount = config.search.defaultMatchCount,
  matchThreshold = config.search.defaultMatchThreshold,
  kindFilter = null,
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

    // Step 2: Generate three separate embeddings for the query (structured to match DB format)
    console.log("[Search] Generating structured embeddings...");
    const embeddings = await generateQueryEmbeddings(query);
    console.log("[Search] Embeddings generated successfully (content, vibe, metadata)");

    // Step 3: Call match_titles_multi RPC with three structured embeddings
    // Always fetch 300 candidates for frontend pagination (no re-fetching on page change)
    const dbMatchCount = 300;

    console.log("[Search] Calling match_titles_multi RPC with 3 structured embeddings...");
    if (kindFilter) {
      console.log("[Search] Filtering by kind: " + kindFilter.join(", "));
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
    }));

    console.log("[Search] Found " + results.length + " results from database");

    // Language and reality filters now handled by is_searchable column in database

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

    // Return all 300 candidates - frontend handles pagination
    const totalResults = finalResults.length;
    console.log("[Search] Returning all " + totalResults + " candidates for frontend pagination");

    // Step 7: Return all results - frontend handles pagination
    return {
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
