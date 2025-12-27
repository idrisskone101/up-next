/**
 * Simple Re-Ranker for upNext
 *
 * Two factors:
 * 1. Recency - boost 2000+ titles by 10%
 * 2. Animation - penalize animated by 30% unless query mentions animation
 */

const ANIMATION_QUERY_TERMS = [
  'animated', 'animation', 'cartoon', 'anime',
  'pixar', 'disney', 'ghibli', 'dreamworks'
];

/**
 * Calibrate raw cosine similarity to intuitive display percentage
 * Raw scores: ~0.30 (average) to ~0.65 (excellent)
 * Display scores: 50% to 95%
 */
function calibrateScore(rawScore) {
  const MIN_RAW = 0.30;
  const MAX_RAW = 0.65;
  const MIN_DISPLAY = 0.50;
  const MAX_DISPLAY = 0.95;

  const normalized = (rawScore - MIN_RAW) / (MAX_RAW - MIN_RAW);
  const clamped = Math.max(0, Math.min(1, normalized));
  return MIN_DISPLAY + clamped * (MAX_DISPLAY - MIN_DISPLAY);
}

/**
 * Check if query mentions animation
 */
function queryMentionsAnimation(query) {
  const lower = query.toLowerCase();
  return ANIMATION_QUERY_TERMS.some(term => lower.includes(term));
}

/**
 * Boost 2000+ titles by 10%
 */
function getRecencyMultiplier(releaseDate) {
  if (!releaseDate) return 1.0;
  const year = new Date(releaseDate).getFullYear();
  return year >= 2000 ? 1.10 : 1.0;
}

/**
 * Penalize animated content by 30% unless query wants animation
 */
function getAnimationMultiplier(genres, queryWantsAnimation) {
  if (queryWantsAnimation) return 1.0;
  const isAnimated = (genres || []).some(g => g.toLowerCase() === 'animation');
  return isAnimated ? 0.70 : 1.0;
}

/**
 * Main re-ranking function
 */
export function rerankResults(results, query, config) {
  if (!results || results.length === 0) return results;
  if (!config.enableReranking) return results;

  const queryWantsAnimation = queryMentionsAnimation(query);

  const rerankedResults = results.map(result => {
    const semanticScore = result.combined_score || 0;
    const recencyMultiplier = getRecencyMultiplier(result.release_date);
    const animationMultiplier = getAnimationMultiplier(result.genres, queryWantsAnimation);
    const rerankedScore = semanticScore * recencyMultiplier * animationMultiplier;

    return {
      ...result,
      reranked_score: calibrateScore(rerankedScore),
      recency_multiplier: recencyMultiplier,
      animation_multiplier: animationMultiplier,
    };
  });

  rerankedResults.sort((a, b) => b.reranked_score - a.reranked_score);
  return rerankedResults;
}
