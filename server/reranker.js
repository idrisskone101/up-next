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

// Common keywords that users might search for
const KEYWORD_PATTERNS = [
  'christmas', 'halloween', 'thanksgiving', 'wedding', 'heist', 'zombie',
  'vampire', 'werewolf', 'alien', 'robot', 'spy', 'superhero', 'apocalypse',
  'revenge', 'serial killer', 'time travel', 'space', 'beach', 'summer',
  'winter', 'holiday', 'new york', 'paris', 'london', 'tokyo'
];

// Thematic concept mappings - maps user concepts to movie keywords/themes
// Uses exact vibe dimension names (satirical not satire) for proper matching
const THEMATIC_CONCEPTS = {
  'capitalism': ['capitalism', 'corporate greed', 'wealth inequality', 'class', 'anti-capitalism', 'corporate', 'wall street', 'greed', 'class differences', 'class struggle', 'satirical', 'social commentary', 'dark', 'cynical', 'gritty'],
  'dystopia': ['dystopia', 'dystopian', 'corporate control', 'surveillance', 'totalitarian', 'oppression', 'police state', 'cyberpunk', 'authoritarian', 'dark', 'gritty', 'bleak'],
  'corporate': ['corporate', 'office', 'workplace', 'capitalism', 'bureaucracy', 'corporate greed', 'evil corporation', 'wall street', 'satirical', 'cynical'],
  'eat the rich': ['class', 'wealth inequality', 'satirical', 'class differences', 'social commentary', 'capitalism', 'dark', 'cynical'],
  'anti-establishment': ['rebellion', 'revolution', 'anarchy', 'resistance', 'fight the system', 'anti-capitalism', 'rebellious', 'subversive', 'cynical'],
  'noir': ['noir', 'detective', 'mystery', 'crime', 'femme fatale', 'private investigator', 'atmospheric', 'brooding', 'dark'],
  'existential': ['existentialism', 'nihilism', 'meaning of life', 'philosophical', 'identity', 'self-discovery', 'melancholic', 'brooding'],
  'mindfuck': ['twist ending', 'mind games', 'psychological thriller', 'unreliable narrator', 'plot twist', 'surreal', 'trippy', 'intense'],
};

/**
 * Calculate recency multiplier
 * Recent titles get a slight boost, no penalty for classics
 *
 * @param {string|null} releaseDate - ISO date string
 * @returns {number} Multiplier (1.0 - 1.10)
 */
function getRecencyMultiplier(releaseDate) {
  if (!releaseDate) return 1.0; // Unknown date = neutral

  const year = new Date(releaseDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 1) return 1.10;   // 2024-2025: 10% boost
  if (age <= 3) return 1.05;   // 2022-2023: 5% boost
  return 1.0;                  // Everything else: neutral (no penalty)
}

/**
 * Extract keywords from query that match known patterns
 * @param {string} query - Search query
 * @returns {string[]} Matched keywords
 */
function extractQueryKeywords(query) {
  const lowerQuery = query.toLowerCase();
  return KEYWORD_PATTERNS.filter(kw => lowerQuery.includes(kw));
}

/**
 * Extract thematic concepts from query and expand to related keywords
 * @param {string} query - Search query
 * @returns {string[]} Expanded keywords to look for in results
 */
function extractThematicKeywords(query) {
  const lowerQuery = query.toLowerCase();
  const expandedKeywords = [];

  for (const [concept, relatedKeywords] of Object.entries(THEMATIC_CONCEPTS)) {
    if (lowerQuery.includes(concept)) {
      expandedKeywords.push(...relatedKeywords);
    }
  }

  // Also check for vibe words that suggest themes
  // Uses exact vibe dimension names for proper matching
  if (lowerQuery.includes('angry') || lowerQuery.includes('rage') || lowerQuery.includes('mad')) {
    expandedKeywords.push('satirical', 'social commentary', 'dark', 'rebellious', 'intense', 'gritty', 'cynical');
  }
  if (lowerQuery.includes('rich') || lowerQuery.includes('wealth') || lowerQuery.includes('money')) {
    expandedKeywords.push('class', 'wealth inequality', 'greed', 'capitalism', 'satirical', 'dark');
  }
  if (lowerQuery.includes('aesthetic') || lowerQuery.includes('vibes') || lowerQuery.includes('mood')) {
    expandedKeywords.push('atmospheric', 'dreamy', 'surreal');
  }
  if (lowerQuery.includes('dark') || lowerQuery.includes('grim') || lowerQuery.includes('bleak')) {
    expandedKeywords.push('dark', 'gritty', 'brooding', 'somber', 'noir', 'bleak');
  }
  if (lowerQuery.includes('fun') || lowerQuery.includes('silly') || lowerQuery.includes('ridiculous')) {
    expandedKeywords.push('comedic', 'playful', 'campy', 'absurdist', 'whimsical');
  }

  return [...new Set(expandedKeywords)]; // Remove duplicates
}

/**
 * Calculate keyword match multiplier
 * Boosts results that have keywords matching the query
 *
 * @param {string[]} queryKeywords - Keywords extracted from query
 * @param {string[]} thematicKeywords - Thematic keywords expanded from query
 * @param {string[]} resultKeywords - Keywords from result
 * @param {string[]} resultGenres - Genres from result
 * @param {string[]} resultThemes - Themes from result
 * @param {Object} resultVibes - Vibes object with scores (e.g., {satirical: 0.7})
 * @returns {number} Multiplier (0.85 - 1.35)
 */
function getKeywordMatchMultiplier(queryKeywords, thematicKeywords, resultKeywords, resultGenres, resultThemes, resultVibes) {
  const keywords = (resultKeywords || []).map(k => k.toLowerCase());
  const genres = (resultGenres || []).map(g => g.toLowerCase());
  const themes = (resultThemes || []).map(t => t.toLowerCase());

  // Extract high-scoring vibes (>= 0.5) as matchable tags
  const vibesTags = [];
  if (resultVibes && typeof resultVibes === 'object') {
    for (const [vibe, score] of Object.entries(resultVibes)) {
      if (score >= 0.5) {
        vibesTags.push(vibe.toLowerCase());
      }
    }
  }

  const allTags = [...keywords, ...genres, ...themes, ...vibesTags];

  let multiplier = 1.0;

  // Check direct keyword matches (e.g., "christmas")
  if (queryKeywords && queryKeywords.length > 0) {
    let directMatchCount = 0;
    for (const qk of queryKeywords) {
      if (allTags.some(tag => tag.includes(qk) || qk.includes(tag))) {
        directMatchCount++;
      }
    }
    if (directMatchCount === 0) {
      multiplier *= 0.90;  // 10% penalty for missing expected keywords
    } else if (directMatchCount === queryKeywords.length) {
      multiplier *= 1.25; // 25% boost for full match
    } else {
      multiplier *= 1.0 + (directMatchCount / queryKeywords.length) * 0.25;
    }
  }

  // Check thematic matches (e.g., "capitalism" -> satire, class, etc.)
  if (thematicKeywords && thematicKeywords.length > 0) {
    let thematicMatchCount = 0;
    for (const tk of thematicKeywords) {
      if (allTags.some(tag => tag.includes(tk) || tk.includes(tag))) {
        thematicMatchCount++;
      }
    }
    // Thematic matches are softer - boost if present, no penalty if absent
    if (thematicMatchCount >= 3) {
      multiplier *= 1.20; // Strong thematic match
    } else if (thematicMatchCount >= 1) {
      multiplier *= 1.10; // Partial thematic match
    }
    // No penalty for missing thematic keywords
  }

  return multiplier;
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

  // Extract keywords from query once
  const queryKeywords = extractQueryKeywords(query);
  const thematicKeywords = extractThematicKeywords(query);

  if (queryKeywords.length > 0) {
    console.log(`[Reranker] Direct keywords: ${queryKeywords.join(', ')}`);
  }
  if (thematicKeywords.length > 0) {
    console.log(`[Reranker] Thematic keywords: ${thematicKeywords.slice(0, 8).join(', ')}${thematicKeywords.length > 8 ? '...' : ''}`);
  }

  const rerankedResults = results.map(result => {
    const semanticScore = result.combined_score || 0;

    // Calculate multipliers
    const recencyMultiplier = getRecencyMultiplier(result.release_date);
    const mainstreamMultiplier = getMainstreamMultiplier(
      result.production_countries,
      result.languages
    );
    const keywordMultiplier = getKeywordMatchMultiplier(
      queryKeywords,
      thematicKeywords,
      result.keywords,
      result.genres,
      result.themes,
      result.vibes
    );

    // Final score = semantic * recency * mainstream * keyword
    const rerankedScore = semanticScore * recencyMultiplier * mainstreamMultiplier * keywordMultiplier;

    return {
      ...result,
      // Keep combined_score as original semantic match for badge display
      // Use reranked_score for sorting order
      reranked_score: rerankedScore,
      recency_multiplier: recencyMultiplier,
      mainstream_multiplier: mainstreamMultiplier,
      keyword_multiplier: keywordMultiplier,
    };
  });

  // Sort by reranked score descending
  rerankedResults.sort((a, b) => b.reranked_score - a.reranked_score);

  const endTime = Date.now();
  console.log(`[Reranker] Re-ranked ${results.length} results in ${endTime - startTime}ms`);

  return rerankedResults;
}
