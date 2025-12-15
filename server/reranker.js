/**
 * Simple Re-Ranker for upNext
 *
 * Two factors only:
 * 1. Recency - boost recent titles, penalize old ones
 * 2. Mainstream - boost English-language, major market productions
 *
 * Both factors are multipliers applied to the semantic score.
 */

// Major English-speaking markets
const MAINSTREAM_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'NZ'];

/**
 * Calculate recency multiplier
 * Recent titles get boosted, old titles get penalized
 *
 * @param {string|null} releaseDate - ISO date string
 * @returns {number} Multiplier (0.85 - 1.15)
 */
function getRecencyMultiplier(releaseDate) {
  if (!releaseDate) return 0.9; // Unknown date = slight penalty

  const year = new Date(releaseDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 1) return 1.15;   // 2024-2025: 15% boost
  if (age <= 3) return 1.10;   // 2022-2023: 10% boost
  if (age <= 5) return 1.05;   // 2020-2021: 5% boost
  if (age <= 10) return 1.0;   // 2015-2019: neutral
  if (age <= 20) return 0.95;  // 2005-2014: 5% penalty
  if (age <= 30) return 0.90;  // 1995-2004: 10% penalty
  return 0.85;                 // Pre-1995: 15% penalty
}

/**
 * Calculate mainstream multiplier
 * English-language titles from US/UK/etc get boosted
 *
 * @param {string[]|null} productionCountries - Array of country codes
 * @param {string[]|null} languages - Array of language codes
 * @returns {number} Multiplier (0.82 - 1.15)
 */
function getMainstreamMultiplier(productionCountries, languages) {
  let multiplier = 1.0;

  // Check production countries
  const countries = productionCountries || [];
  const isMainstreamCountry = countries.some(c => MAINSTREAM_COUNTRIES.includes(c));

  if (isMainstreamCountry) {
    multiplier *= 1.10; // 10% boost for US/UK/CA/AU/NZ
  } else if (countries.length > 0) {
    multiplier *= 0.92; // 8% penalty for other markets
  } else {
    multiplier *= 0.95; // 5% penalty for unknown origin
  }

  // Check language
  const langs = languages || [];
  const hasEnglish = langs.includes('en');

  if (hasEnglish) {
    multiplier *= 1.05; // 5% boost for English
  } else if (langs.length > 0) {
    multiplier *= 0.90; // 10% penalty for non-English
  }
  // Unknown language = neutral (no change)

  return multiplier;
}

/**
 * Main re-ranking function
 *
 * @param {Array} results - Search results from Supabase
 * @param {string} query - Original search query (unused for now)
 * @param {Object} config - Configuration object
 * @returns {Array} Re-ranked results
 */
export function rerankResults(results, query, config) {
  if (!results || results.length === 0) return results;
  if (!config.enableReranking) return results;

  const startTime = Date.now();

  const rerankedResults = results.map(result => {
    const semanticScore = result.combined_score || 0;

    // Calculate multipliers
    const recencyMultiplier = getRecencyMultiplier(result.release_date);
    const mainstreamMultiplier = getMainstreamMultiplier(
      result.production_countries,
      result.languages
    );

    // Final score = semantic * recency * mainstream
    const rerankedScore = semanticScore * recencyMultiplier * mainstreamMultiplier;

    return {
      ...result,
      reranked_score: rerankedScore,
      recency_multiplier: recencyMultiplier,
      mainstream_multiplier: mainstreamMultiplier,
    };
  });

  // Sort by reranked score descending
  rerankedResults.sort((a, b) => b.reranked_score - a.reranked_score);

  const endTime = Date.now();
  console.log(`[Reranker] Re-ranked ${results.length} results in ${endTime - startTime}ms`);

  return rerankedResults;
}
