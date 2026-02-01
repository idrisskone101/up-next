-- Quick fix: Reduce candidates to speed up searches
-- This is faster to apply and still improves performance significantly

CREATE OR REPLACE FUNCTION public.match_titles_multi(
  query_content_embedding vector,
  query_vibe_embedding vector,
  query_metadata_embedding vector,
  weight_content double precision DEFAULT 0.4,
  weight_vibe double precision DEFAULT 0.35,
  weight_metadata double precision DEFAULT 0.25,
  weight_popularity double precision DEFAULT 0.0,
  match_threshold double precision DEFAULT 0.0,
  match_count integer DEFAULT 20,
  filter_kind text[] DEFAULT NULL::text[],
  min_release_year integer DEFAULT NULL::integer,
  exclude_genres text[] DEFAULT NULL::text[],
  max_release_year integer DEFAULT NULL::integer
)
RETURNS TABLE(
  id bigint,
  title text,
  kind text,
  release_date date,
  overview text,
  genres text[],
  director text,
  vibes jsonb,
  themes text[],
  keywords text[],
  runtime_minutes integer,
  vote_average double precision,
  certification text,
  poster_path text,
  backdrop_path text,
  movie_cast jsonb,
  languages text[],
  production_countries text[],
  providers jsonb,
  content_score double precision,
  vibe_score double precision,
  metadata_score double precision,
  popularity_score double precision,
  combined_score double precision,
  strongest_signal text
)
LANGUAGE plpgsql
AS $function$
DECLARE
  semantic_weight FLOAT;
  candidates_per_embedding INT;
BEGIN
  semantic_weight := 1.0 - weight_popularity;
  -- REDUCED: From LEAST(match_count * 2, 250) to LEAST(match_count * 2, 100)
  -- For 150 result searches: 250 -> 100 candidates per embedding (60% reduction)
  candidates_per_embedding := LEAST(match_count * 2, 100);
  PERFORM set_config('hnsw.ef_search', '80', true); -- Also reduced ef_search from 120 to 80

  RETURN QUERY
  WITH content_candidates AS (
    SELECT t.id as cid
    FROM titles t
    WHERE t.poster_path IS NOT NULL
      AND t.content_embedding IS NOT NULL
      AND t.vibe_embedding IS NOT NULL
      AND t.metadata_embedding IS NOT NULL
      AND (t.languages IS NULL OR t.languages = '{}' OR 'en' = ANY(t.languages)
           OR (t.production_countries && ARRAY['US','GB','CA','AU','NZ','IE'])
           OR ('ja' = ANY(t.languages) AND t.genres && ARRAY['animation']))
      AND (filter_kind IS NULL OR t.kind = ANY(filter_kind))
      AND (min_release_year IS NULL OR EXTRACT(YEAR FROM t.release_date) >= min_release_year)
      AND (max_release_year IS NULL OR EXTRACT(YEAR FROM t.release_date) <= max_release_year)
      AND (exclude_genres IS NULL OR NOT (t.genres && exclude_genres))
    ORDER BY t.content_embedding <=> query_content_embedding
    LIMIT candidates_per_embedding
  ),
  vibe_candidates AS (
    SELECT t.id as cid
    FROM titles t
    WHERE t.poster_path IS NOT NULL
      AND t.content_embedding IS NOT NULL
      AND t.vibe_embedding IS NOT NULL
      AND t.metadata_embedding IS NOT NULL
      AND (t.languages IS NULL OR t.languages = '{}' OR 'en' = ANY(t.languages)
           OR (t.production_countries && ARRAY['US','GB','CA','AU','NZ','IE'])
           OR ('ja' = ANY(t.languages) AND t.genres && ARRAY['animation']))
      AND (filter_kind IS NULL OR t.kind = ANY(filter_kind))
      AND (min_release_year IS NULL OR EXTRACT(YEAR FROM t.release_date) >= min_release_year)
      AND (max_release_year IS NULL OR EXTRACT(YEAR FROM t.release_date) <= max_release_year)
      AND (exclude_genres IS NULL OR NOT (t.genres && exclude_genres))
    ORDER BY t.vibe_embedding <=> query_vibe_embedding
    LIMIT candidates_per_embedding
  ),
  metadata_candidates AS (
    SELECT t.id as cid
    FROM titles t
    WHERE t.poster_path IS NOT NULL
      AND t.content_embedding IS NOT NULL
      AND t.vibe_embedding IS NOT NULL
      AND t.metadata_embedding IS NOT NULL
      AND (t.languages IS NULL OR t.languages = '{}' OR 'en' = ANY(t.languages)
           OR (t.production_countries && ARRAY['US','GB','CA','AU','NZ','IE'])
           OR ('ja' = ANY(t.languages) AND t.genres && ARRAY['animation']))
      AND (filter_kind IS NULL OR t.kind = ANY(filter_kind))
      AND (min_release_year IS NULL OR EXTRACT(YEAR FROM t.release_date) >= min_release_year)
      AND (max_release_year IS NULL OR EXTRACT(YEAR FROM t.release_date) <= max_release_year)
      AND (exclude_genres IS NULL OR NOT (t.genres && exclude_genres))
    ORDER BY t.metadata_embedding <=> query_metadata_embedding
    LIMIT candidates_per_embedding
  ),
  all_candidates AS (
    SELECT cid FROM content_candidates
    UNION
    SELECT cid FROM vibe_candidates
    UNION
    SELECT cid FROM metadata_candidates
  ),
  scored AS (
    SELECT
      t.id, t.title, t.kind, t.release_date, t.overview, t.genres, t.director,
      t.vibes, t.themes, t.keywords, t.runtime_minutes, t.vote_average::float,
      t.certification, t.poster_path, t.backdrop_path, t."cast" as movie_cast,
      t.languages, t.production_countries, t.providers,
      (1 - (t.content_embedding <=> query_content_embedding))::float as content_score,
      (1 - (t.vibe_embedding <=> query_vibe_embedding))::float as vibe_score,
      (1 - (t.metadata_embedding <=> query_metadata_embedding))::float as metadata_score,
      (
        LEAST(COALESCE(t.vote_count, 0)::float / 500.0, 1.0) *
        (COALESCE(LEAST(t.vote_average::float / 10.0, 1.0), 0) * 0.7 +
         COALESCE(LEAST(LOG(GREATEST(t.vote_count, 1)) / 10.0, 1.0), 0) * 0.3)
      )::float as popularity_score,
      (
        (weight_content * (1 - (t.content_embedding <=> query_content_embedding)) +
         weight_vibe * (1 - (t.vibe_embedding <=> query_vibe_embedding)) +
         weight_metadata * (1 - (t.metadata_embedding <=> query_metadata_embedding))) * semantic_weight +
        (
          LEAST(COALESCE(t.vote_count, 0)::float / 500.0, 1.0) *
          (COALESCE(LEAST(t.vote_average::float / 10.0, 1.0), 0) * 0.7 +
           COALESCE(LEAST(LOG(GREATEST(t.vote_count, 1)) / 10.0, 1.0), 0) * 0.3)
        ) * weight_popularity
      )::float as raw_combined,
      CASE
        WHEN (1 - (t.content_embedding <=> query_content_embedding)) >=
             GREATEST((1 - (t.vibe_embedding <=> query_vibe_embedding)),
                     (1 - (t.metadata_embedding <=> query_metadata_embedding))) THEN 'content'
        WHEN (1 - (t.vibe_embedding <=> query_vibe_embedding)) >=
             (1 - (t.metadata_embedding <=> query_metadata_embedding)) THEN 'vibe'
        ELSE 'metadata'
      END as strongest_signal
    FROM titles t
    INNER JOIN all_candidates c ON t.id = c.cid
  )
  SELECT
    s.id, s.title, s.kind, s.release_date, s.overview, s.genres, s.director,
    s.vibes, s.themes, s.keywords, s.runtime_minutes, s.vote_average,
    s.certification, s.poster_path, s.backdrop_path, s.movie_cast,
    s.languages, s.production_countries, s.providers,
    s.content_score, s.vibe_score, s.metadata_score, s.popularity_score,
    s.raw_combined as combined_score,
    s.strongest_signal
  FROM scored s
  ORDER BY s.raw_combined DESC
  LIMIT LEAST(match_count, 400);
END;
$function$;

COMMENT ON FUNCTION match_titles_multi IS 'Reduced candidates from 250 to 100 per embedding for faster searches with minimal quality tradeoff.';
