/**
 * API client for movie search backend
 */

const API_BASE_URL = '/api';
const FETCH_TIMEOUT = 65000; // 65 seconds (slightly longer than server timeout)
const MAX_RETRIES = 2; // Maximum number of retry attempts

/**
 * Helper function to create a timeout promise
 */
function createTimeoutPromise(timeoutMs) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
}

/**
 * Helper function to sleep for a given duration
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search for movies and TV shows with timeout and retry logic
 * Returns all 300 candidates sorted by VIBE score - frontend handles pagination
 * @param {string} query - Search query
 * @param {number} matchCount - Ignored, backend always fetches 300 candidates
 * @param {number} matchThreshold - Minimum similarity threshold
 * @param {string[]|null} kindFilter - Filter by media type: ['movie'], ['tv'], or null for both
 * @param {number|null} minReleaseYear - Filter out titles before this year
 * @param {string[]|null} excludeGenres - Filter out titles with these genres
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<Object>} All search results sorted by vibe_score
 */
export async function searchMovies(query, matchCount = 80, matchThreshold = 0, kindFilter = null, minReleaseYear = null, excludeGenres = null, retryCount = 0) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT);

  try {
    const response = await Promise.race([
      fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          matchCount,
          matchThreshold,
          kindFilter,
          minReleaseYear,
          excludeGenres,
        }),
        signal: abortController.signal,
      }),
      createTimeoutPromise(FETCH_TIMEOUT),
    ]);

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.timeout = errorData.timeout || response.status === 504;

      // Retry on timeout or 504 errors if we haven't exceeded max retries
      if ((error.timeout || response.status === 504) && retryCount < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
        console.log(`[API] Retrying search (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms...`);
        await sleep(delay);
        return searchMovies(query, matchCount, matchThreshold, kindFilter, minReleaseYear, excludeGenres, retryCount + 1);
      }

      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout errors
    if (error.name === 'AbortError' || error.message === 'Request timeout') {
      const timeoutError = new Error('Search request timed out. The server may be busy. Please try again.');
      timeoutError.timeout = true;

      // Retry on timeout if we haven't exceeded max retries
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`[API] Retrying search after timeout (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms...`);
        await sleep(delay);
        return searchMovies(query, matchCount, matchThreshold, kindFilter, minReleaseYear, excludeGenres, retryCount + 1);
      }

      throw timeoutError;
    }

    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Check API health
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

/**
 * Fetch trailer for a movie or TV show
 * @param {number} tmdbId - The TMDB ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<Object|null>} Trailer information or null if not found
 */
export async function fetchTrailer(tmdbId, mediaType = 'movie') {
  try {
    const response = await fetch(`${API_BASE_URL}/trailer/${tmdbId}?mediaType=${mediaType}`);

    if (response.status === 404) {
      return null; // No trailer found
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Trailer fetch error:', error);
    return null; // Return null instead of throwing to gracefully handle missing trailers
  }
}

/**
 * Fetch recommended titles for homepage
 * @returns {Promise<Object>} Recommended titles
 */
export async function fetchRecommendations() {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    throw error;
  }
}
