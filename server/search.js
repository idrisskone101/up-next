import { createClient } from "@supabase/supabase-js";
import {
  analyzeQueryIntent,
  generateQueryEmbeddings,
  getFixedWeights,
} from "./embeddings.js";
import { rerankResults } from "./reranker.js";
import { config } from "./config.js";

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

/**
 * Main search handler - orchestrates query analysis, embedding generation, and database search
 * Supports both fixed weights (fast) and dynamic LLM-based weights (slower but adaptive)
 * Now includes re-ranking to enhance results with quality signals
 *
 * @param {string} query - The user's search query
 * @param {number} matchCount - Number of results to return (default: from config)
 * @param {number} matchThreshold - Minimum similarity score (default: from config)
 * @param {string[]|null} kindFilter - Filter by media type: ['movie'], ['tv'], or null for both
 * @returns {Promise<Object>} Search results with weights and reasoning
 */
export async function searchTitles(
  query,
  matchCount = config.search.defaultMatchCount,
  matchThreshold = config.search.defaultMatchThreshold,
  kindFilter = null,
) {
  try {
    console.log(`[Search] Query: "${query}"`);
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
      `[Search] Weights (${weightSource}): content=${weights.content.toFixed(2)}, vibe=${weights.vibe.toFixed(2)}, metadata=${weights.metadata.toFixed(2)}`,
    );

    // Step 2: Generate three embeddings for the query
    console.log("[Search] Generating embeddings...");
    const embeddings = await generateQueryEmbeddings(query);
    console.log("[Search] Embeddings generated successfully");

    // Step 3: Call Supabase RPC function for multi-embedding search
    console.log("[Search] Calling Supabase match_titles_multi...");
    if (kindFilter) {
      console.log(`[Search] Filtering by kind: ${kindFilter.join(', ')}`);
    }
    const dbStartTime = Date.now();
    const { data, error } = await supabase.rpc("match_titles_multi", {
      query_content_embedding: embeddings.content,
      query_vibe_embedding: embeddings.vibe,
      query_metadata_embedding: embeddings.metadata,
      weight_content: weights.content,
      weight_vibe: weights.vibe,
      weight_metadata: weights.metadata,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_kind: kindFilter,
    });
    const dbEndTime = Date.now();

    if (error) {
      console.error("[Search] Supabase error:", error);
      throw new Error(`Database search failed: ${error.message}`);
    }

    console.log(`[Search] Found ${data?.length || 0} results from database (${dbEndTime - dbStartTime}ms)`);

    // Step 4: Re-rank results if enabled
    let finalResults = data || [];
    let rerankingApplied = false;
    
    if (config.enableReranking && finalResults.length > 0) {
      try {
        const rerankStartTime = Date.now();
        finalResults = rerankResults(finalResults, query, config);
        const rerankEndTime = Date.now();
        rerankingApplied = true;
        console.log(`[Search] Re-ranking completed (${rerankEndTime - rerankStartTime}ms)`);
      } catch (rerankError) {
        console.error("[Search] Re-ranking failed, using original results:", rerankError);
        // Gracefully fall back to original results if re-ranking fails
        finalResults = data || [];
      }
    } else if (!config.enableReranking) {
      console.log("[Search] Re-ranking DISABLED in config");
    }

    const searchEndTime = Date.now();
    console.log(`[Search] Total search time: ${searchEndTime - searchStartTime}ms`);

    // Step 5: Return formatted results
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
