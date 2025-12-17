# Partial Index Migration Plan

Optimize search by creating a partial HNSW index on pre-filtered titles.

**Goal:** Get more search results without sacrificing speed by moving filters into the database.

**Current state:** 500 HNSW candidates → post-filters remove ~30% → ~54 usable results

**After migration:** 500 HNSW candidates = 500 usable results (no waste)

---

## Phase 1: Add Column ✅ DONE

Added `is_searchable` boolean column to titles table.

---

## Phase 2: Populate is_searchable ✅ DONE

Run the migration script:

```bash
node server/migrations/populate-searchable.js
```

**Features:**
- 100 rows/batch with 500ms delays
- Saves progress to `.searchable-progress.json` - can stop/resume anytime
- Auto-retries failed batches
- ~64k titles at ~100/sec = ~10-15 min

**If still timing out:** Edit `populate-searchable.js` and reduce `BATCH_SIZE` to 50.

**Expected result:** ~9,133 titles marked as `is_searchable = true`

---

## Phase 3: Create Partial HNSW Index ✅ DONE

After Phase 2 completes, run in **Supabase Dashboard > SQL Editor**:

```sql
CREATE INDEX CONCURRENTLY titles_content_searchable_idx
ON titles USING hnsw (content_embedding vector_cosine_ops)
WITH (m = 24, ef_construction = 128)
WHERE is_searchable = TRUE;
```

This creates a smaller, faster index (~73MB vs 116MB) that only includes searchable titles.

**Verify index was created:**

```sql
SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE indexname = 'titles_content_searchable_idx';
```

---

## Phase 4: Update SQL Function ✅ DONE

Updated `match_titles_multi` to use the partial index.

```sql
CREATE OR REPLACE FUNCTION match_titles_multi(
  query_content_embedding vector(1536),
  query_vibe_embedding vector(1536),
  query_metadata_embedding vector(1536),
  weight_content float DEFAULT 0.4,
  weight_vibe float DEFAULT 0.35,
  weight_metadata float DEFAULT 0.25,
  weight_popularity float DEFAULT 0.0,
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 60,
  filter_kind text[] DEFAULT NULL
)
RETURNS TABLE (
  id int,
  title text,
  kind text,
  release_date date,
  overview text,
  genres text[],
  director text,
  vibes jsonb,
  themes text[],
  keywords text[],
  runtime_minutes int,
  vote_average float,
  certification text,
  poster_path text,
  backdrop_path text,
  movie_cast text[],
  languages text[],
  production_countries text[],
  content_score float,
  vibe_score float,
  metadata_score float,
  popularity_score float,
  combined_score float,
  strongest_signal text
)
LANGUAGE plpgsql AS $$
DECLARE
  semantic_weight FLOAT;
  candidate_multiplier INT := 5; -- Increased from 3
BEGIN
  semantic_weight := 1.0 - weight_popularity;

  PERFORM set_config('hnsw.ef_search', '100', true);

  RETURN QUERY
  WITH candidates AS (
    SELECT t.id as cid
    FROM titles t
    WHERE t.is_searchable = TRUE  -- Use partial index
      AND (filter_kind IS NULL OR t.kind = ANY(filter_kind))
    ORDER BY t.content_embedding <=> query_content_embedding
    LIMIT LEAST(match_count * candidate_multiplier, 1000)  -- Increased from 500
  )
  SELECT
    t.id, t.title, t.kind, t.release_date, t.overview, t.genres, t.director,
    t.vibes, t.themes, t.keywords, t.runtime_minutes, t.vote_average,
    t.certification, t.poster_path, t.backdrop_path, t.cast as movie_cast,
    t.languages, t.production_countries,
    (1 - (t.content_embedding <=> query_content_embedding))::float as content_score,
    (1 - (t.vibe_embedding <=> query_vibe_embedding))::float as vibe_score,
    (1 - (t.metadata_embedding <=> query_metadata_embedding))::float as metadata_score,
    (COALESCE(LEAST(t.vote_average / 10.0, 1.0), 0) * 0.7 +
     COALESCE(LEAST(LOG(GREATEST(t.vote_count, 1)) / 10.0, 1.0), 0) * 0.3)::float as popularity_score,
    ((weight_content * (1 - (t.content_embedding <=> query_content_embedding)) +
      weight_vibe * (1 - (t.vibe_embedding <=> query_vibe_embedding)) +
      weight_metadata * (1 - (t.metadata_embedding <=> query_metadata_embedding))) * semantic_weight +
     (COALESCE(LEAST(t.vote_average / 10.0, 1.0), 0) * 0.7 +
      COALESCE(LEAST(LOG(GREATEST(t.vote_count, 1)) / 10.0, 1.0), 0) * 0.3) * weight_popularity)::float as combined_score,
    CASE
      WHEN (1 - (t.content_embedding <=> query_content_embedding)) >=
           GREATEST((1 - (t.vibe_embedding <=> query_vibe_embedding)),
                   (1 - (t.metadata_embedding <=> query_metadata_embedding))) THEN 'content'
      WHEN (1 - (t.vibe_embedding <=> query_vibe_embedding)) >=
           (1 - (t.metadata_embedding <=> query_metadata_embedding)) THEN 'vibe'
      ELSE 'metadata'
    END as strongest_signal
  FROM titles t
  INNER JOIN candidates c ON t.id = c.cid
  WHERE (match_threshold <= 0 OR (
    (1 - (t.content_embedding <=> query_content_embedding)) > match_threshold OR
    (1 - (t.vibe_embedding <=> query_vibe_embedding)) > match_threshold OR
    (1 - (t.metadata_embedding <=> query_metadata_embedding)) > match_threshold))
  ORDER BY combined_score DESC
  LIMIT LEAST(match_count, 400);  -- Increased from 200
END;
$$;
```

**Key changes:**
- `WHERE t.is_searchable = TRUE` - Uses partial index
- `candidate_multiplier`: 3 → 5
- Max candidates: 500 → 1000
- Max results: 200 → 400

---

## Phase 5: Remove Node.js Post-Filters ✅ DONE

Removed language and reality filters from `server/search.js` - now handled by `is_searchable`:

1. **Language filter** (lines ~166-169):
```js
// REMOVE - now handled by is_searchable
// const beforeFilter = results.length;
// results = results.filter(title => isAcceptableContent(title));
// console.log("[Search] Language filter: " + beforeFilter + " -> " + results.length + " results");
```

2. **Reality filter** (lines ~171-177):
```js
// REMOVE - now handled by is_searchable
// const beforeRealityFilter = results.length;
// results = results.filter(title => {
//   const genres = title.genres || [];
//   return !genres.some(g => g.toLowerCase() === 'reality');
// });
// console.log("[Search] Reality filter: " + beforeRealityFilter + " -> " + results.length + " results");
```

Also update `server/index.js` validation to allow higher matchCount:
```js
// Line 182-183: Change 200 to 400
if (matchCount < 1 || matchCount > 400) {
```

---

## Phase 6: Test Performance ✅ DONE

Tested with Playwright - search working correctly:

```bash
# Test search performance
curl -X POST http://localhost:5001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "samurai movies with honor and revenge", "matchCount": 200}'
```

**Expected improvements:**
- Same or better query speed
- 2-3x more results for specific queries
- No post-filter waste

---

## Rollback (if needed)

If something goes wrong, you can revert:

```sql
-- Drop the partial index
DROP INDEX IF EXISTS titles_content_searchable_idx;

-- Restore original function (run the old CREATE OR REPLACE)
```

And restore the Node.js filters in `search.js`.
