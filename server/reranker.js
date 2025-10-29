/**
 * Re-Ranking Engine for upNext
 * 
 * Enhances semantic search results by incorporating quality signals, recency,
 * diversity optimization, and query intent detection.
 * 
 * Core principle: Preserve semantic relevance (75%) while layering in
 * quality (15%), popularity (5%), and recency (5%) signals.
 */

/**
 * Detects keywords and patterns in queries to adjust ranking strategy
 * 
 * @param {string} query - The user's search query
 * @returns {{wantsRecent: boolean, wantsBest: boolean, wantsUnderrated: boolean, wantsClassic: boolean}}
 */
function detectQueryIntent(query) {
  const lowerQuery = query.toLowerCase();
  
  return {
    wantsRecent: /\b(recent|new|latest|2024|2025|this year)\b/.test(lowerQuery),
    wantsBest: /\b(best|top|greatest|highest rated|masterpiece)\b/.test(lowerQuery),
    wantsUnderrated: /\b(underrated|hidden gem|overlooked|undiscovered|sleeper)\b/.test(lowerQuery),
    wantsClassic: /\b(classic|timeless|iconic|legendary|vintage)\b/.test(lowerQuery),
  };
}

/**
 * Calculates quality score combining rating and vote count confidence
 * High rating + high vote count = most trustworthy
 * 
 * @param {Object} title - Title object from database
 * @returns {number} Quality score between 0 and 1
 */
function calculateQualityScore(title) {
  const { vote_average, vote_count } = title;
  
  // Normalize rating to 0-1 scale
  const ratingScore = (vote_average || 0) / 10;
  
  // Logarithmic confidence based on vote count
  // 10 votes = 0.1, 100 votes = 0.2, 1000 votes = 0.3, 10000 votes = 0.4
  const confidenceScore = Math.min(Math.log10((vote_count || 1) + 1) / 5, 1.0);
  
  // Weight rating more heavily than confidence (70/30 split)
  return ratingScore * 0.7 + confidenceScore * 0.3;
}

/**
 * Calculates popularity score from popularity and vote count
 * 
 * @param {Object} title - Title object from database
 * @returns {number} Popularity score between 0 and 1
 */
function calculatePopularityScore(title) {
  const { popularity, vote_count } = title;
  
  // Normalize popularity (typical range 0-100, cap at 50 for normalization)
  const popularityScore = Math.min((popularity || 0) / 50, 1.0);
  
  // Vote count as popularity indicator (log scale)
  const votePopularityScore = Math.min(Math.log10((vote_count || 1) + 1) / 5, 1.0);
  
  // Blend both signals
  return popularityScore * 0.5 + votePopularityScore * 0.5;
}

/**
 * Calculates recency score based on release date
 * 
 * @param {Object} title - Title object from database
 * @param {boolean} queryWantsRecent - Whether query explicitly wants recent content
 * @returns {number} Recency score between 0 and 1
 */
function calculateRecencyScore(title, queryWantsRecent = false) {
  if (!title.release_date) return 0.5; // Neutral score for missing dates
  
  const releaseYear = new Date(title.release_date).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - releaseYear;
  
  // If query wants recent content, heavily boost 2024-2025
  if (queryWantsRecent) {
    if (age <= 1) return 1.0;  // 2024-2025: maximum boost
    if (age <= 3) return 0.8;  // 2022-2023: good boost
    if (age <= 5) return 0.6;  // 2020-2021: moderate boost
    return 0.3;                // Older: minimal score
  }
  
  // Normal recency scoring (gradual decay)
  if (age <= 2) return 1.0;
  if (age <= 5) return 0.8;
  if (age <= 10) return 0.6;
  if (age <= 20) return 0.4;
  return 0.2;
}

/**
 * Applies completeness boost/penalty based on data quality
 * 
 * @param {Object} title - Title object from database
 * @param {number} threshold - Completeness threshold multiplier (default 0.85)
 * @returns {number} Multiplier between 0.0 and 1.0
 */
function calculateCompletenessMultiplier(title, threshold = 0.85) {
  let multiplier = 1.0;
  
  // Penalize missing or placeholder descriptions
  if (!title.overview || 
      title.overview === "No description available." ||
      title.overview.length < 20) {
    multiplier *= threshold;
  }
  
  // Penalize missing vibes/themes (indicates incomplete enrichment)
  if (!title.vibes || title.vibes.length === 0) {
    multiplier *= 0.95;
  }
  
  return multiplier;
}

/**
 * Applies diversity constraints to reduce clustering
 * 
 * @param {Array} results - Sorted results array
 * @param {Object} diversityConfig - Configuration for diversity rules
 * @returns {Array} Results with diversity penalties applied
 */
function applyDiversityFilters(results, diversityConfig) {
  const { maxSameCollection, maxSameDirector, penaltyFactor } = diversityConfig;
  
  const collectionCounts = {};
  const directorCounts = {};
  
  return results.map(result => {
    let diversityMultiplier = 1.0;
    
    // Track collection/franchise clustering
    if (result.collection_id) {
      collectionCounts[result.collection_id] = (collectionCounts[result.collection_id] || 0) + 1;
      
      if (collectionCounts[result.collection_id] > maxSameCollection) {
        diversityMultiplier *= penaltyFactor;
      }
    }
    
    // Track director clustering
    if (result.director) {
      directorCounts[result.director] = (directorCounts[result.director] || 0) + 1;
      
      if (directorCounts[result.director] > maxSameDirector) {
        diversityMultiplier *= penaltyFactor;
      }
    }
    
    return {
      ...result,
      diversity_multiplier: diversityMultiplier,
    };
  });
}

/**
 * Main re-ranking function
 * 
 * @param {Array} results - Search results from Supabase
 * @param {string} query - Original search query
 * @param {Object} config - Re-ranking configuration
 * @returns {Array} Re-ranked results
 */
export function rerankResults(results, query, config) {
  if (!results || results.length === 0) return results;
  if (!config.enableReranking) return results;
  
  const startTime = Date.now();
  
  // Step 1: Detect query intent
  const intent = detectQueryIntent(query);
  console.log(`[Reranker] Query intent: ${JSON.stringify(intent)}`);
  
  // Step 2: Calculate enhanced scores for each result
  const scoredResults = results.map(result => {
    // Semantic score (from database)
    const semanticScore = result.combined_score || 0;
    
    // Quality score
    let qualityScore = calculateQualityScore(result);
    
    // Boost quality if query wants "best"
    if (intent.wantsBest) {
      qualityScore *= 1.2; // 20% boost for quality when "best" is in query
    }
    
    // Adjust quality for "underrated" queries
    if (intent.wantsUnderrated) {
      // Boost high quality + lower popularity
      const isUnderrated = qualityScore > 0.7 && calculatePopularityScore(result) < 0.5;
      if (isUnderrated) {
        qualityScore *= 1.3;
      }
    }
    
    // Popularity score
    const popularityScore = calculatePopularityScore(result);
    
    // Recency score
    let recencyScore = calculateRecencyScore(result, intent.wantsRecent);
    
    // Boost classics (older + high quality)
    if (intent.wantsClassic) {
      const releaseYear = result.release_date ? new Date(result.release_date).getFullYear() : 2000;
      const isOld = new Date().getFullYear() - releaseYear > 20;
      if (isOld && qualityScore > 0.75) {
        qualityScore *= 1.2;
      }
    }
    
    // Step 3: Apply completeness multiplier
    const completenessMultiplier = calculateCompletenessMultiplier(
      result,
      config.completenessThreshold
    );
    
    // Step 4: Calculate final weighted score
    const weights = config.rerankingWeights;
    const finalScore = (
      semanticScore * weights.semantic +
      qualityScore * weights.quality +
      popularityScore * weights.popularity +
      recencyScore * weights.recency
    ) * completenessMultiplier;
    
    return {
      ...result,
      reranked_score: finalScore,
      quality_score_component: qualityScore,
      popularity_score_component: popularityScore,
      recency_score_component: recencyScore,
      completeness_multiplier: completenessMultiplier,
    };
  });
  
  // Step 5: Apply diversity filters
  const diversifiedResults = applyDiversityFilters(
    scoredResults,
    config.diversity
  );
  
  // Step 6: Apply diversity multipliers to final scores
  const finalResults = diversifiedResults.map(result => ({
    ...result,
    reranked_score: result.reranked_score * (result.diversity_multiplier || 1.0),
  }));
  
  // Step 7: Sort by reranked score
  finalResults.sort((a, b) => b.reranked_score - a.reranked_score);
  
  const endTime = Date.now();
  console.log(`[Reranker] Re-ranked ${results.length} results in ${endTime - startTime}ms`);
  
  return finalResults;
}

/**
 * Helper function to explain re-ranking for a specific result
 * Useful for debugging and understanding score components
 * 
 * @param {Object} result - Re-ranked result object
 * @returns {string} Human-readable explanation
 */
export function explainReranking(result) {
  return `
Score Breakdown for "${result.title}":
- Semantic: ${(result.combined_score * 100).toFixed(1)}%
- Quality: ${(result.quality_score_component * 100).toFixed(1)}%
- Popularity: ${(result.popularity_score_component * 100).toFixed(1)}%
- Recency: ${(result.recency_score_component * 100).toFixed(1)}%
- Completeness: ${(result.completeness_multiplier * 100).toFixed(1)}%
- Diversity: ${((result.diversity_multiplier || 1.0) * 100).toFixed(1)}%
- Final: ${(result.reranked_score * 100).toFixed(1)}%
  `.trim();
}
