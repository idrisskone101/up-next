-- Fix statement timeout for match_titles_multi function
-- This sets a 30 second timeout specifically for this function
-- to prevent timeout errors on similar searches
-- Migration: fix_statement_timeout
-- Date: 2026-01-31

-- Set statement_timeout for match_titles_multi function
ALTER FUNCTION public.match_titles_multi(
  vector, vector, vector,
  double precision, double precision, double precision,
  double precision, double precision,
  integer, text[], integer, text[], integer
) SET statement_timeout = '30s';

COMMENT ON FUNCTION match_titles_multi IS 'Multi-embedding vector search with 30s timeout and 250 candidates per embedding for optimal performance.';
