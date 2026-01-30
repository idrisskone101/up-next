/**
 * Vibe Conflict Detection System
 *
 * Automatically excludes tonally incompatible results based on query intent.
 * No user interaction required - detects intent from keywords and filters
 * results that conflict with detected vibes.
 *
 * Example: "cozy rainy day vibes" -> excludes horror films (dark >= 0.7)
 */

/**
 * Intent clusters mapping keywords to exclusion rules
 * Each cluster has:
 * - keywords: trigger words that indicate this intent
 * - excludeVibes: vibe thresholds that disqualify a title
 */
const INTENT_CLUSTERS = {
  // Fall/Autumn - exclude Christmas/holiday content
  fall: {
    keywords: [
      'fall', 'autumn', 'autumnal', 'october', 'november', 'harvest',
      'back to school', 'thanksgiving', 'falling leaves', 'pumpkin spice'
    ],
    excludeVibes: {},
    excludeKeywords: ['christmas', 'holiday', 'santa', 'xmas', 'new year']
  },
  // Romantic comedy - must check genres since vibes can be misleading
  romcom: {
    keywords: [
      'romcom', 'rom-com', 'romantic comedy', 'enemies to lovers', 'friends to lovers',
      'love story', 'meet cute', 'meet-cute', 'love triangle', 'will they won\'t they',
      'slow burn romance', 'fake dating', 'second chance romance', 'opposites attract'
    ],
    excludeVibes: { dark: 0.6, gritty: 0.6, tense: 0.7, intense: 0.7, suspenseful: 0.7 },
    excludeGenres: ['action', 'thriller', 'horror', 'war', 'crime']
  },
  comfort: {
    keywords: [
      'cozy', 'cosy', 'relaxing', 'feel-good', 'feel good', 'comfort', 'comfortable',
      'wholesome', 'heartwarming', 'warm', 'chill', 'peaceful', 'soothing', 'calming',
      'gentle', 'soft', 'mellow', 'easygoing', 'laid-back', 'laid back', 'snuggly',
      'rainy day', 'sunday morning', 'comfort food', 'hygge'
    ],
    excludeVibes: { dark: 0.7, gritty: 0.7, tense: 0.7, intense: 0.7 },
    excludeGenres: ['horror', 'thriller']
  },
  dark: {
    keywords: [
      'dark', 'gritty', 'disturbing', 'bleak', 'noir', 'heavy', 'brutal', 'grim',
      'twisted', 'sinister', 'ominous', 'depressing', 'nihilistic', 'cynical',
      'morbid', 'macabre', 'unsettling', 'harrowing'
    ],
    excludeVibes: { lighthearted: 0.7, comedic: 0.7, whimsical: 0.7, playful: 0.7 }
  },
  funny: {
    keywords: [
      'funny', 'comedy', 'hilarious', 'laugh', 'laughing', 'comedic', 'witty',
      'humorous', 'silly', 'goofy', 'lighthearted', 'light-hearted', 'absurd',
      'ridiculous', 'campy', 'satirical', 'parody', 'spoof', 'slapstick'
    ],
    excludeVibes: { dark: 0.7, somber: 0.7, melancholic: 0.7, gritty: 0.7 }
  },
  scary: {
    keywords: [
      'scary', 'horror', 'terrifying', 'creepy', 'spooky', 'frightening',
      'nightmare', 'haunting', 'eerie', 'chilling', 'bone-chilling', 'jump scare',
      'slasher', 'supernatural horror', 'psychological horror'
    ],
    excludeVibes: { comedic: 0.7, heartwarming: 0.7, lighthearted: 0.7, whimsical: 0.7 }
  },
  thrilling: {
    keywords: [
      'thrilling', 'suspenseful', 'edge of seat', 'edge-of-seat', 'nail-biting',
      'gripping', 'intense', 'adrenaline', 'action-packed', 'explosive',
      'high-stakes', 'heart-pounding', 'pulse-pounding'
    ],
    excludeVibes: { cozy: 0.7, dreamy: 0.6, contemplative: 0.6 }
  },
  emotional: {
    keywords: [
      'cry', 'crying', 'tearjerker', 'emotional', 'heartbreaking', 'devastating',
      'moving', 'touching', 'sad', 'bittersweet', 'poignant', 'gut-wrenching',
      'ugly cry', 'make me cry', 'tissues ready'
    ],
    // No exclusions - emotional films span all tones (sad horror exists, sad comedy exists)
    excludeVibes: {}
  },
  family: {
    keywords: [
      'with parents', 'with family', 'family friendly', 'family movie night',
      'with kids', 'with grandparents', 'family night', 'movie night with parents',
      'all ages', 'with mom', 'with dad', 'with my parents'
    ],
    excludeVibes: { dark: 0.7, gritty: 0.7, provocative: 0.6 },
    excludeGenres: ['horror', 'thriller'],
    excludeCertifications: ['R', 'NC-17', 'TV-MA', '18', 'X']
  }
};

/**
 * Detects query intent by matching keywords
 * Uses word boundary matching to avoid false positives
 *
 * @param {string} query - User's search query
 * @returns {string|null} - Intent name or null if no intent detected
 */
export function detectQueryIntent(query) {
  if (!query) return null;

  const normalized = query.toLowerCase();

  // Check each cluster for keyword matches
  // Order matters: more specific intents checked first
  for (const [intent, cluster] of Object.entries(INTENT_CLUSTERS)) {
    for (const keyword of cluster.keywords) {
      // Use word boundary matching for single words, substring for phrases
      if (keyword.includes(' ')) {
        // Multi-word phrase: use simple includes
        if (normalized.includes(keyword)) {
          return intent;
        }
      } else {
        // Single word: use word boundary regex to avoid partial matches
        // e.g., "warm" should not match "warming" in some contexts
        const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
        if (pattern.test(normalized)) {
          return intent;
        }
      }
    }
  }

  return null;
}

/**
 * Checks if a title has vibes or genres that conflict with detected intent
 *
 * @param {Object} title - Title object with vibes and genres properties
 * @param {string} intent - Detected intent name
 * @returns {boolean} - True if title should be EXCLUDED (has conflict)
 */
export function hasVibeConflict(title, intent) {
  const cluster = INTENT_CLUSTERS[intent];

  // No cluster = no conflict
  if (!cluster) {
    return false;
  }

  // Check keyword exclusions (for seasonal conflicts like fall vs christmas)
  if (cluster.excludeKeywords && cluster.excludeKeywords.length > 0) {
    // Check title name
    const titleLower = (title.title || '').toLowerCase();
    for (const keyword of cluster.excludeKeywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        return true; // Title name contains excluded keyword
      }
    }
    // Check keywords array if present
    if (title.keywords && Array.isArray(title.keywords)) {
      const titleKeywords = title.keywords.map(k => k.toLowerCase());
      for (const excludedKeyword of cluster.excludeKeywords) {
        if (titleKeywords.some(k => k.includes(excludedKeyword.toLowerCase()))) {
          return true; // Keyword conflict found - exclude this title
        }
      }
    }
  }

  // Check genre exclusions first (more reliable than vibes)
  if (cluster.excludeGenres && cluster.excludeGenres.length > 0 && title.genres) {
    const titleGenres = title.genres.map(g => g.toLowerCase());
    for (const excludedGenre of cluster.excludeGenres) {
      if (titleGenres.includes(excludedGenre.toLowerCase())) {
        return true; // Genre conflict found - exclude this title
      }
    }
  }

  // Check certification exclusions (e.g., R-rated for family context)
  if (cluster.excludeCertifications && cluster.excludeCertifications.length > 0 && title.certification) {
    const cert = title.certification.toUpperCase();
    if (cluster.excludeCertifications.some(c => c.toUpperCase() === cert)) {
      return true; // Certification conflict found - exclude this title
    }
  }

  // Check vibe exclusions
  if (cluster.excludeVibes && Object.keys(cluster.excludeVibes).length > 0 && title.vibes) {
    for (const [vibe, threshold] of Object.entries(cluster.excludeVibes)) {
      const vibeScore = parseFloat(title.vibes[vibe]) || 0;
      if (vibeScore >= threshold) {
        return true; // Vibe conflict found - exclude this title
      }
    }
  }

  return false;
}

/**
 * Filters results to remove titles with vibe conflicts
 *
 * @param {Array} results - Array of title objects
 * @param {string} intent - Detected intent name
 * @returns {Array} - Filtered results with conflicts removed
 */
export function filterVibeConflicts(results, intent) {
  if (!intent || !results || results.length === 0) {
    return results;
  }

  return results.filter(title => !hasVibeConflict(title, intent));
}

/**
 * Get the exclusion rules for an intent (useful for debugging/logging)
 *
 * @param {string} intent - Intent name
 * @returns {Object|null} - Exclusion rules or null
 */
export function getIntentExclusions(intent) {
  return INTENT_CLUSTERS[intent]?.excludeVibes || null;
}

/**
 * Get all available intents (useful for debugging)
 *
 * @returns {string[]} - Array of intent names
 */
export function getAvailableIntents() {
  return Object.keys(INTENT_CLUSTERS);
}
