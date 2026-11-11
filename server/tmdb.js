import { config } from './config.js';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';

async function tmdb(path, params = {}) {
  const url = new URL(TMDB_API_BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.tmdbToken}` },
  });
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText} (${path})`);
  }
  return response.json();
}

function normalizeTitle(title = '') {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]/g, '');
}

const yearOf = (date) => (date ? parseInt(date.slice(0, 4), 10) : null);

/**
 * Find the TMDB entry for an LLM-suggested title.
 * Prefers exact title + year (±1), then a close title variant ("Hachi" vs "Hachi: A Dog's Tale"),
 * then an exact title from another year, then an unfiltered top hit from the right year
 * ("12 Monkeys" vs "Twelve Monkeys"). Anything looser is dropped to avoid wrong posters.
 */
export async function findTitle(title, year, kind) {
  const yearParam = kind === 'tv' ? 'first_air_date_year' : 'primary_release_year';
  const dateField = kind === 'tv' ? 'first_air_date' : 'release_date';
  const nameFields = kind === 'tv' ? ['name', 'original_name'] : ['title', 'original_title'];
  const target = normalizeTitle(title);

  const names = (r) => nameFields.map((f) => normalizeTitle(r[f])).filter(Boolean);
  const yearGap = (r) => Math.abs((yearOf(r[dateField]) ?? 0) - year);
  const closeYear = (r) => !year || yearGap(r) <= 1;
  const exact = (r) => names(r).includes(target);
  const variant = (r) => names(r).some((n) => Math.min(n.length, target.length) >= 5 && (n.includes(target) || target.includes(n)));

  const exactMatch = (results) => results.find((r) => exact(r) && closeYear(r));

  const withYear = (await tmdb(`/search/${kind}`, { query: title, [yearParam]: year })).results || [];
  const strict = exactMatch(withYear);
  if (strict) return strict.id;

  const withoutYear = (await tmdb(`/search/${kind}`, { query: title })).results || [];
  const match =
    exactMatch(withoutYear) ||
    [...withYear.slice(0, 3), ...withoutYear.slice(0, 3)].find((r) => variant(r) && closeYear(r)) ||
    withoutYear.filter(exact).sort((a, b) => yearGap(a) - yearGap(b))[0] ||
    (year && withoutYear.slice(0, 3).find(closeYear));
  return match?.id ?? null;
}

/**
 * Fetch full details for a title and map to the shape the frontend renders.
 */
export async function getTitleDetails(id, kind) {
  const extras = kind === 'tv' ? 'credits,content_ratings,watch/providers' : 'credits,release_dates,watch/providers';
  const d = await tmdb(`/${kind}/${id}`, { append_to_response: extras });

  const certification = kind === 'tv'
    ? d.content_ratings?.results?.find((r) => r.iso_3166_1 === 'US')?.rating
    : d.release_dates?.results
        ?.find((r) => r.iso_3166_1 === 'US')
        ?.release_dates?.find((r) => r.certification)?.certification;

  const director = kind === 'tv'
    ? d.created_by?.map((c) => c.name).join(', ')
    : d.credits?.crew?.filter((c) => c.job === 'Director').map((c) => c.name).join(', ');

  return {
    id: d.id,
    title: kind === 'tv' ? d.name : d.title,
    kind,
    release_date: (kind === 'tv' ? d.first_air_date : d.release_date) || null,
    overview: d.overview || null,
    genres: (d.genres || []).map((g) => g.name),
    director: director || null,
    cast: (d.credits?.cast || []).slice(0, 10).map((c) => ({ name: c.name, character: c.character })),
    runtime_minutes: (kind === 'tv' ? d.episode_run_time?.[0] : d.runtime) || null,
    vote_average: d.vote_average || null,
    vote_count: d.vote_count || 0,
    certification: certification || null,
    poster_path: d.poster_path,
    backdrop_path: d.backdrop_path,
    original_language: d.original_language,
    providers: d['watch/providers']?.results?.US || null,
  };
}

/**
 * Title autocomplete for @mentions (movies + TV, people excluded)
 */
export async function searchTitlesByName(query, limit) {
  const data = await tmdb('/search/multi', { query, include_adult: false });
  return (data.results || [])
    .filter((r) => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      title: r.media_type === 'tv' ? r.name : r.title,
      kind: r.media_type,
      poster_path: r.poster_path,
      release_date: (r.media_type === 'tv' ? r.first_air_date : r.release_date) || null,
    }));
}

/**
 * Trending titles for the homepage
 */
export async function getTrending() {
  const data = await tmdb('/trending/all/week');
  return (data.results || [])
    .filter((r) => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
    .map((r) => ({
      id: r.id,
      title: r.media_type === 'tv' ? r.name : r.title,
      kind: r.media_type,
      release_date: (r.media_type === 'tv' ? r.first_air_date : r.release_date) || null,
      overview: r.overview,
      vote_average: r.vote_average,
      poster_path: r.poster_path,
      backdrop_path: r.backdrop_path,
    }));
}

/**
 * Fetch trailer videos for a movie or TV show from TMDB
 * @param {number} tmdbId - The TMDB ID of the movie/TV show
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<Object>} Trailer information
 */
export async function fetchTrailer(tmdbId, mediaType = 'movie') {
  if (mediaType !== 'movie' && mediaType !== 'tv') {
    throw new Error('Media type must be "movie" or "tv"');
  }

  const data = await tmdb(`/${mediaType}/${tmdbId}/videos`);
  const youtubeTrailers = (data.results || []).filter((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const candidates = [...youtubeTrailers.filter((v) => v.official), ...youtubeTrailers.filter((v) => !v.official)].slice(0, 5);

  // TMDB sometimes lists private/removed/non-embeddable videos; YouTube oEmbed rejects those (401/403/404)
  const playable = await Promise.all(candidates.map(async (v) => {
    try {
      const res = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${v.key}`);
      return res.ok;
    } catch {
      return true; // oEmbed unreachable: don't hide the trailer
    }
  }));
  const trailer = candidates.find((_, i) => playable[i]);
  if (!trailer) return null;

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
