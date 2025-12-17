import { fetchTrailer } from './api';

const cache = new Map();
const pending = new Map();

export function getTrailer(tmdbId) {
  return cache.get(tmdbId);
}

export function hasTrailer(tmdbId) {
  return cache.has(tmdbId);
}

export async function prefetchTrailers(movies, limit = 10) {
  const toPrefetch = movies.slice(0, limit).filter(m => {
    const id = m.tmdb_id || m.id;
    return id && !cache.has(id) && !pending.has(id);
  });

  const promises = toPrefetch.map(async (movie) => {
    const id = movie.tmdb_id || movie.id;
    const mediaType = movie.kind === 'tv' ? 'tv' : 'movie';

    pending.set(id, true);
    try {
      const data = await fetchTrailer(id, mediaType);
      if (data) cache.set(id, data);
    } catch (e) {
      // Silently fail - trailer will be fetched on demand
    } finally {
      pending.delete(id);
    }
  });

  await Promise.all(promises);
}
