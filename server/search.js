import { createClient } from "@supabase/supabase-js";
import { analyzeQueryIntent, generateQueryEmbeddings } from "./embeddings.js";
import { config } from "./config.js";

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

/**
 * Main search handler - orchestrates query analysis, embedding generation, and database search
 *
 * @param {string} query - The user's search query
 * @param {number} matchCount - Number of results to return (default: 10)
 * @param {number} matchThreshold - Minimum similarity score (default: 0.3)
 * @returns {Promise<Object>} Search results with weights and reasoning
 */
export async function searchTitles(
  query,
  matchCount = 10,
  matchThreshold = 0.3,
) {
  try {
    console.log(`[Search] Query: "${query}"`);

    // Step 1: Analyze query intent to get optimal weights
    console.log("[Search] Analyzing query intent with LLM...");
    const weights = await analyzeQueryIntent(query);
    console.log("[Search] Weights:", weights);

    // Step 2: Generate three embeddings for the query
    console.log("[Search] Generating embeddings...");
    const embeddings = await generateQueryEmbeddings(query);
    console.log("[Search] Embeddings generated successfully");

    // Step 3: Call Supabase RPC function for multi-embedding search
    console.log("[Search] Calling Supabase match_titles_multi...");
    const { data, error } = await supabase.rpc("match_titles_multi", {
      query_content_embedding: embeddings.content,
      query_vibe_embedding: embeddings.vibe,
      query_metadata_embedding: embeddings.metadata,
      weight_content: weights.content,
      weight_vibe: weights.vibe,
      weight_metadata: weights.metadata,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error("[Search] Supabase error:", error);
      throw new Error(`Database search failed: ${error.message}`);
    }

    console.log(`[Search] Found ${data?.length || 0} results`);

    // Step 4: Return formatted results
    return {
      query,
      weights: {
        content: weights.content,
        vibe: weights.vibe,
        metadata: weights.metadata,
      },
      weightReasoning: weights.reasoning,
      results: data || [],
      count: data?.length || 0,
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
