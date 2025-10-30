# Search Timeout Fix - Implementation Summary

## What Was Fixed

### Root Cause
The `match_titles_multi` PostgreSQL function was performing **full table scans** on 5,891 rows for all 3 embeddings, causing Supabase statement timeouts (~10 seconds).

### Evidence
- Supabase Performance Advisor showed 3 unused vector indexes
- Postgres logs showed multiple "canceling statement due to statement timeout" errors
- The OR condition across embeddings prevented index usage

## Changes Made

### 1. Database - Created 3 New Indexed Functions

Created via Supabase migration:
- `match_titles_by_content(query_embedding, match_threshold, match_count)`
- `match_titles_by_vibe(query_embedding, match_threshold, match_count)`
- `match_titles_by_metadata(query_embedding, match_threshold, match_count)`

Each function:
- Queries a single embedding vector (enables index usage)
- Uses `ORDER BY embedding <=> query` to trigger index
- Returns only `id` and `similarity` score
- Expected performance: ~100-300ms per query

### 2. Server Code - Modified `server/search.js`

#### Added Merge Function (lines 13-80)
```javascript
function mergeAndScoreResults(contentResults, vibeResults, metadataResults, weights)
```
- Aggregates results from 3 parallel queries
- Calculates weighted combined scores
- Determines strongest signal (content/vibe/metadata)
- Sorts by combined score

#### Refactored Search Logic (lines 62-182)
- **Before**: Single RPC call to `match_titles_multi` (slow, full table scan)
- **After**: 3 parallel RPC calls using indexes, then merge in Node.js

Changes:
- Lines 77-93: Run 3 parallel indexed queries with `Promise.all`
- Lines 107-114: Merge results with weighted scoring
- Lines 119-180: Fetch full title data for top results only
- Lines 154-172: Map scores back to title data

## Performance Improvement

**Expected Performance:**
- **Before**: 10+ seconds (timeout)
- **After**: <2 seconds total
  - 3 parallel queries: ~300ms (each uses its index)
  - Merge in Node.js: <50ms
  - Fetch title data: ~200ms
  - LLM embedding generation: ~1s (unchanged)

## Next Steps - RESTART REQUIRED

**The server must be restarted** to pick up the code changes:

1. Stop the current server (Ctrl+C in terminal)
2. Restart with: `npm run dev` or `node server/index.js`
3. Test search queries

## Testing

Once restarted, test with:

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "action movies", "matchCount": 20}' \
  -w "\nTime: %{time_total}s\n"
```

Expected: Response in < 5 seconds (vs previous 10+ second timeout)

## Files Modified

1. ✅ Supabase database - 3 new functions created (migration applied)
2. ✅ `server/search.js` - Refactored to use parallel queries
3. No changes to frontend or config files

## Configuration Notes

- Dynamic weights: Already disabled (as you mentioned)
- Query structuring: Left as-is
- Match count: Respects user parameters
- All existing features maintained

## Rollback Plan

If issues occur, the old `match_titles_multi` function still exists and can be used by reverting `server/search.js` changes.

