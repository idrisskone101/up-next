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
    // For pagination, fetch more results initially to allow multiple pages
    // Calculate how many results we need: (page * pageSize) to ensure we have enough
    const resultsNeeded = page * pageSize;
    const dbMatchCount = Math.max(matchCount, resultsNeeded, 60); // Fetch at least 60 for pagination
    
    console.log("[Search] Calling Supabase match_titles_multi...");
    if (kindFilter) {
      console.log(`[Search] Filtering by kind: ${kindFilter.join(', ')}`);
    }
    console.log(`[Search] Pagination: page=${page}, pageSize=${pageSize}, fetching ${dbMatchCount} results`);
    
    const dbStartTime = Date.now();
    const { data, error } = await supabase.rpc("match_titles_multi", {
      query_content_embedding: embeddings.content,
      query_vibe_embedding: embeddings.vibe,
      query_metadata_embedding: embeddings.metadata,
      weight_content: weights.content,
      weight_vibe: weights.vibe,
      weight_metadata: weights.metadata,
      match_threshold: matchThreshold,
      match_count: dbMatchCount,
      filter_kind: kindFilter,
    });
    const dbEndTime = Date.now();

    if (error) {
      console.error("[Search] Supabase error:", error);
      throw new Error(`Database search failed: ${error.message}`);
    }

    console.log(`[Search] Found ${data?.length || 0} results from database (${dbEndTime - dbStartTime}ms)`);

    // Step 4: Re-rank results if enabled (only top 30 for performance)
    let finalResults = data || [];
    let rerankingApplied = false;
    const RERANK_LIMIT = 30; // Only rerank top 30 results
    
    if (config.enableReranking && finalResults.length > 0) {
      try {
        const rerankStartTime = Date.now();
        
        // Split results into top N (to rerank) and rest (to keep as-is)
        const resultsToRerank = finalResults.slice(0, RERANK_LIMIT);
        const remainingResults = finalResults.slice(RERANK_LIMIT);
        
        // Only rerank the top results
        const rerankedTop = rerankResults(resultsToRerank, query, config);
        
        // Combine reranked top with remaining results
        finalResults = [...rerankedTop, ...remainingResults];
        
        const rerankEndTime = Date.now();
        rerankingApplied = true;
        console.log(`[Search] Re-ranking completed for top ${resultsToRerank.length} results (${rerankEndTime - rerankStartTime}ms)`);
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

    // Step 5: Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = finalResults.slice(startIndex, endIndex);
    const totalResults = finalResults.length;
    const hasMore = endIndex < totalResults;
    const totalPages = Math.ceil(totalResults / pageSize);

    console.log(`[Search] Pagination: Returning page ${page} of ${totalPages} (${paginatedResults.length} results, ${totalResults} total)`);

    // Step 6: Return formatted results with pagination metadata
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
