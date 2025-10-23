import { config } from './config.js';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';

/**
 * Fetch trailer videos for a movie or TV show from TMDB
 * @param {number} tmdbId - The TMDB ID of the movie/TV show
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<Object>} Trailer information
 */
export async function fetchTrailer(tmdbId, mediaType = 'movie') {
  if (!config.tmdbToken) {
    throw new Error('TMDB token not configured');
  }

  if (!tmdbId) {
    throw new Error('TMDB ID is required');
  }

  // Validate media type
  if (mediaType !== 'movie' && mediaType !== 'tv') {
    throw new Error('Media type must be "movie" or "tv"');
  }

  try {
    const url = `${TMDB_API_BASE}/${mediaType}/${tmdbId}/videos`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.tmdbToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Filter for official YouTube trailers
    const trailers = data.results?.filter(
      video =>
        video.site === 'YouTube' &&
        video.type === 'Trailer' &&
        video.official === true
    ) || [];

    // If no official trailers, fall back to any YouTube trailers
    const fallbackTrailers = data.results?.filter(
      video =>
        video.site === 'YouTube' &&
        video.type === 'Trailer'
    ) || [];

    const selectedTrailers = trailers.length > 0 ? trailers : fallbackTrailers;

    // Return the first trailer (usually the main/official one)
    if (selectedTrailers.length > 0) {
      const trailer = selectedTrailers[0];
      return {
        key: trailer.key,
        name: trailer.name,
        site: trailer.site,
        type: trailer.type,
        official: trailer.official,
        youtubeUrl: `https://www.youtube.com/watch?v=${trailer.key}`,
        embedUrl: `https://www.youtube.com/embed/${trailer.key}`,
      };
    }

    return null;
  } catch (error) {
    console.error('[TMDB] Error fetching trailer:', error);
    throw error;
  }
}
