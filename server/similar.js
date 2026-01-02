import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";
import { TTLCache } from "./cache.js";

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

// Similar titles cache: 15min TTL
const similarCache = new TTLCache(15, "similar");

// Weights for similar search (vibe-heavy)
const SIMILAR_WEIGHTS = {
  content: 0.30,
  vibe: 0.45,
  metadata: 0.25,
};

/**
 * Generate cache key for similar titles lookup
 */
function getSimilarCacheKey(titleId, kindFilter, minReleaseYear, excludeGenres) {
  const filterStr = kindFilter ? kindFilter.sort().join(",") : "all";
  const yearStr = minReleaseYear || "any";
  const genreStr = excludeGenres ? excludeGenres.sort().join(",") : "none";
  return `similar:${titleId}:${filterStr}:${yearStr}:${genreStr}`;
}

/**
 * Find titles similar to a given title using its embeddings
 * Uses vibe-heavy weights for better "feel" matching
 *
 * @param {number} titleId - Source title ID
 * @param {string[]|null} kindFilter - Filter by media type
 * @param {number|null} minReleaseYear - Minimum release year
 * @param {string[]|null} excludeGenres - Genres to exclude
 * @returns {Promise<Object>} Similar titles with metadata
 */
export async function findSimilarTitles(
  titleId,
  kindFilter = null,
  minReleaseYear = null,
  excludeGenres = null
) {
  const startTime = Date.now();
  console.log(`[Similar] Finding titles similar to ID: ${titleId}`);

  // Check cache
  const cacheKey = getSimilarCacheKey(titleId, kindFilter, minReleaseYear, excludeGenres);
  const cached = similarCache.get(cacheKey);
  if (cached) {
    console.log(`[Similar] Cache HIT - returning in ${Date.now() - startTime}ms`);
    return cached;
  }

  // Fetch source title with embeddings
  const { data: sourceTitle, error: fetchError } = await supabase
    .from("titles")
    .select("id, title, content_embedding, vibe_embedding, metadata_embedding")
    .eq("id", titleId)
    .single();

  if (fetchError || !sourceTitle) {
    console.error("[Similar] Failed to fetch source title:", fetchError);
    throw new Error(`Title not found: ${titleId}`);
  }

  // Check embeddings exist
  if (!sourceTitle.content_embedding || !sourceTitle.vibe_embedding || !sourceTitle.metadata_embedding) {
    throw new Error(`Title ${titleId} has missing embeddings`);
  }

  console.log(`[Similar] Source title: "${sourceTitle.title}"`);

  // Call match_titles_multi with source title's embeddings
  const { data, error } = await supabase.rpc("match_titles_multi", {
    query_content_embedding: sourceTitle.content_embedding,
    query_vibe_embedding: sourceTitle.vibe_embedding,
    query_metadata_embedding: sourceTitle.metadata_embedding,
    weight_content: SIMILAR_WEIGHTS.content,
    weight_vibe: SIMILAR_WEIGHTS.vibe,
    weight_metadata: SIMILAR_WEIGHTS.metadata,
    weight_popularity: 0,
    match_threshold: 0.0,
    match_count: 301, // Extra to account for excluding source
    filter_kind: kindFilter,
    min_release_year: minReleaseYear,
    exclude_genres: excludeGenres,
  });

  if (error) {
    console.error("[Similar] RPC error:", error);
    throw new Error(`Similar search failed: ${error.message}`);
  }

  // Process results, excluding source title
  const results = (data || [])
    .filter(row => row.id !== titleId)
    .slice(0, 300)
    .map(row => ({
      id: row.id,
      title: row.title,
      kind: row.kind,
      release_date: row.release_date,
      overview: row.overview,
      genres: row.genres,
      director: row.director,
      vibes: row.vibes,
      themes: row.themes,
      keywords: row.keywords,
      runtime_minutes: row.runtime_minutes,
      vote_average: row.vote_average,
      certification: row.certification,
      poster_path: row.poster_path,
      backdrop_path: row.backdrop_path,
      cast: row.movie_cast,
      languages: row.languages,
      production_countries: row.production_countries,
      content_score: row.content_score,
      vibe_score: row.vibe_score,
      metadata_score: row.metadata_score,
      combined_score: row.combined_score,
      strongest_signal: row.strongest_signal,
    }));

  const duration = Date.now() - startTime;
  console.log(`[Similar] Found ${results.length} similar titles in ${duration}ms`);

  const result = {
    sourceId: titleId,
    sourceTitle: sourceTitle.title,
    weights: SIMILAR_WEIGHTS,
    results,
    count: results.length,
  };

  // Cache result
  similarCache.set(cacheKey, result);

  return result;
}
