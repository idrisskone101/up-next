/**
 * API client for movie search backend
 */

const API_BASE_URL = '/api';

/**
 * Search for movies and TV shows
 * @param {string} query - Search query
 * @param {number} matchCount - Number of results to return
 * @param {number} matchThreshold - Minimum similarity threshold
 * @returns {Promise<Object>} Search results
 */
export async function searchMovies(query, matchCount = 20, matchThreshold = 0.3) {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        matchCount,
        matchThreshold,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
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
