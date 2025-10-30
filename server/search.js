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
 * Check if content is acceptable based on language and production country
 * @param {Object} title - Title object with languages, production_countries, and genres
 * @returns {boolean} - True if content should be included
 */
function isAcceptableContent(title) {
  const ENGLISH_SPEAKING_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'NZ', 'IE'];
  
  // Check if English language
  if (title.languages?.includes('en')) return true;
  
  // Check if from English-speaking country
  if (title.production_countries?.some(c => ENGLISH_SPEAKING_COUNTRIES.includes(c))) {
    return true;
  }
  
  // Check if Japanese anime (special exception)
  if (title.languages?.includes('ja') && title.genres?.includes('Animation')) {
    return true;
  }
  
  return false;
}

/**
 * Merge and score results from 3 parallel vector searches
 * @param {Array} contentResults - Results from content embedding search
 * @param {Array} vibeResults - Results from vibe embedding search
 * @param {Array} metadataResults - Results from metadata embedding search
 * @param {Object} weights - Weights for each embedding type
 * @returns {Array} - Merged and sorted results with combined scores
 */
function mergeAndScoreResults(contentResults, vibeResults, metadataResults, weights) {
  const scoreMap = new Map();

  // Aggregate scores from content embedding
  contentResults.forEach(r => {
    const existing = scoreMap.get(r.id) || { id: r.id, scores: {} };
    existing.scores.content = r.similarity;
    scoreMap.set(r.id, existing);
  });

  // Aggregate scores from vibe embedding
  vibeResults.forEach(r => {
    const existing = scoreMap.get(r.id) || { id: r.id, scores: {} };
    existing.scores.vibe = r.similarity;
    scoreMap.set(r.id, existing);
  });

  // Aggregate scores from metadata embedding
  metadataResults.forEach(r => {
    const existing = scoreMap.get(r.id) || { id: r.id, scores: {} };
    existing.scores.metadata = r.similarity;
    scoreMap.set(r.id, existing);
  });

  // Calculate combined scores and determine strongest signal
  const results = Array.from(scoreMap.values())
    .map(item => {
      const contentScore = item.scores.content || 0;
      const vibeScore = item.scores.vibe || 0;
      const metadataScore = item.scores.metadata || 0;

      const combinedScore =
        contentScore * weights.content +
        vibeScore * weights.vibe +
        metadataScore * weights.metadata;

      // Determine which signal was strongest
      let strongestSignal = 'content';
      let maxScore = contentScore;
      if (vibeScore > maxScore) {
        strongestSignal = 'vibe';
        maxScore = vibeScore;
      }
      if (metadataScore > maxScore) {
        strongestSignal = 'metadata';
      }

      return {
        id: item.id,
        content_score: contentScore,
        vibe_score: vibeScore,
        metadata_score: metadataScore,
        combined_score: combinedScore,
        strongest_signal: strongestSignal,
      };
    })
    .sort((a, b) => b.combined_score - a.combined_score);

  return results;
}

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

    // Step 3: Run 3 parallel indexed vector searches (fast!)
    // Each query uses its respective vector index instead of full table scan
    const resultsNeeded = page * pageSize;
    // Fetch one extra result to determine if there are more pages
    const dbMatchCount = Math.max(matchCount, resultsNeeded + 1);
    const perEmbeddingLimit = Math.ceil(dbMatchCount * 1.5); // Fetch extra to ensure enough after merging
    
    console.log("[Search] Running 3 parallel indexed queries...");
    if (kindFilter) {
      console.log(`[Search] Filtering by kind: ${kindFilter.join(', ')}`);
    }
    console.log(`[Search] Pagination: page=${page}, pageSize=${pageSize}, fetching ${dbMatchCount} results`);
    
    const dbStartTime = Date.now();
    
    // Execute 3 indexed queries in parallel
    const [contentResult, vibeResult, metadataResult] = await Promise.all([
      supabase.rpc("match_titles_by_content", {
        query_embedding: embeddings.content,
        match_threshold: matchThreshold,
        match_count: perEmbeddingLimit,
      }),
      supabase.rpc("match_titles_by_vibe", {
        query_embedding: embeddings.vibe,
        match_threshold: matchThreshold,
        match_count: perEmbeddingLimit,
      }),
      supabase.rpc("match_titles_by_metadata", {
        query_embedding: embeddings.metadata,
        match_threshold: matchThreshold,
        match_count: perEmbeddingLimit,
      }),
    ]);

    // Check for errors
    if (contentResult.error || vibeResult.error || metadataResult.error) {
      const error = contentResult.error || vibeResult.error || metadataResult.error;
      console.error("[Search] Supabase error:", error);
      throw new Error(`Database search failed: ${error.message}`);
    }

    const dbEndTime = Date.now();
    console.log(`[Search] Parallel queries completed in ${dbEndTime - dbStartTime}ms`);
    console.log(`[Search] Results: content=${contentResult.data?.length || 0}, vibe=${vibeResult.data?.length || 0}, metadata=${metadataResult.data?.length || 0}`);

    // Step 4: Merge results with weighted scoring
    const mergeStartTime = Date.now();
    const scoredResults = mergeAndScoreResults(
      contentResult.data || [],
      vibeResult.data || [],
      metadataResult.data || [],
      weights
    );
    console.log(`[Search] Merged to ${scoredResults.length} unique titles in ${Date.now() - mergeStartTime}ms`);

    // Step 5: Fetch full title data for top results
    const topResultIds = scoredResults.slice(0, dbMatchCount).map(r => r.id);
    
    let data = [];
    if (topResultIds.length === 0) {
      console.log("[Search] No results found");
    } else {
      // Fetch full title data
      const fetchStartTime = Date.now();
      const { data: titlesData, error: fetchError } = await supabase
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
          backdrop_path,
          languages,
          production_countries
        `)
        .in("id", topResultIds);

      if (fetchError) {
        console.error("[Search] Error fetching title data:", fetchError);
        throw new Error(`Failed to fetch title data: ${fetchError.message}`);
      }

      console.log(`[Search] Fetched ${titlesData?.length || 0} titles in ${Date.now() - fetchStartTime}ms`);

      // Create a map for quick lookup and preserve scores
      const scoreMap = new Map(scoredResults.map(r => [r.id, r]));
      
      // Merge title data with scores, maintaining score order
      data = topResultIds
        .map(id => {
          const title = titlesData.find(t => t.id === id);
          const scoreData = scoreMap.get(id);
          if (!title || !scoreData) return null;
          
          return {
            ...title,
            content_score: scoreData.content_score,
            vibe_score: scoreData.vibe_score,
            metadata_score: scoreData.metadata_score,
            combined_score: scoreData.combined_score,
            strongest_signal: scoreData.strongest_signal,
          };
        })
        .filter(Boolean);
      
      // Apply language filter (English, English-speaking countries, or anime)
      const beforeLanguageFilter = data.length;
      data = data.filter(title => isAcceptableContent(title));
      console.log(`[Search] Language filter applied: ${beforeLanguageFilter} -> ${data.length} results`);
      
      // Apply kind filter if specified
      if (kindFilter && kindFilter.length > 0) {
        const beforeFilter = data.length;
        data = data.filter(title => kindFilter.includes(title.kind));
        console.log(`[Search] Kind filter applied: ${beforeFilter} -> ${data.length} results`);
      }
    }

    console.log(`[Search] Found ${data?.length || 0} results from database (${Date.now() - dbStartTime}ms)`);

    // Step 6: Re-rank results if enabled (all fetched results)
    let finalResults = data || [];
    let rerankingApplied = false;
    
    if (config.enableReranking && finalResults.length > 0) {
      try {
        const rerankStartTime = Date.now();
        
        // Re-rank all fetched results
        finalResults = rerankResults(finalResults, query, config);
        
        const rerankEndTime = Date.now();
        rerankingApplied = true;
        console.log(`[Search] Re-ranking completed for ${finalResults.length} results (${rerankEndTime - rerankStartTime}ms)`);
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

    // Step 7: Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = finalResults.slice(startIndex, endIndex);
    // Check if there are more results: if we got a full page AND there are more results beyond this page
    const hasMore = paginatedResults.length === pageSize && finalResults.length > endIndex;
    // Total results available (may be more, but we only know what we fetched)
    const totalResults = finalResults.length;
    // Calculate total pages based on fetched results (conservative estimate)
    const totalPages = Math.ceil(totalResults / pageSize);

    console.log(`[Search] Pagination: Returning page ${page} (${paginatedResults.length} results, hasMore: ${hasMore}, fetched ${totalResults} total)`);

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
