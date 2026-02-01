import { fetchTrailer } from './api';

const cache = new Map();
const pending = new Map();
const MAX_CACHE_SIZE = 100;

// LRU tracking: Map of tmdbId -> timestamp
const accessOrder = new Map();

export function getTrailer(tmdbId) {
  const trailer = cache.get(tmdbId);
  if (trailer) {
    // Update access time for LRU
    accessOrder.set(tmdbId, Date.now());
  }
  return trailer;
}

export function hasTrailer(tmdbId) {
  return cache.has(tmdbId);
}

function evictLRU() {
  if (cache.size < MAX_CACHE_SIZE) return;

  // Find least recently accessed entry
  let oldestId = null;
  let oldestTime = Infinity;

  for (const [id, time] of accessOrder) {
    if (time < oldestTime) {
      oldestTime = time;
      oldestId = id;
    }
  }

  if (oldestId) {
    cache.delete(oldestId);
    accessOrder.delete(oldestId);
  }
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
      if (data) {
        evictLRU();
        cache.set(id, data);
        accessOrder.set(id, Date.now());
      }
    } catch (e) {
      // Silently fail - trailer will be fetched on demand
    } finally {
      pending.delete(id);
    }
  });

  await Promise.all(promises);
}
