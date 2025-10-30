# Vector Search Quick Reference

## Current Configuration (Post-Optimization)

### Vector Indexes
```
✅ 3 HNSW indexes active (1536-dim each)
   - content_embedding: m=24, ef_construction=128
   - vibe_embedding: m=24, ef_construction=128  
   - metadata_embedding: m=24, ef_construction=128

✅ Query parameter: hnsw.ef_search=150 (set in functions)
✅ Pre-warming: Enabled (loads indexes into RAM on startup)
```

### Storage
```
Total: 505 MB
├── Table data: 13 MB
└── Indexes: 491 MB
    ├── Vector indexes: ~142 MB (48+47+47 MB)
    └── Other indexes: ~349 MB
```

### Dataset
```
Titles: 5,891 (100% embedding coverage)
Columns: 3 separate 1536-dim vectors
- content_embedding (story/narrative)
- vibe_embedding (emotional/atmospheric)
- metadata_embedding (factual/categorical)
```

---

## Key Performance Metrics

### Expected Query Performance
```
Single vector search: 25-35ms
3 parallel searches: 30-50ms
Full search pipeline: 200-400ms (including re-ranking)
```

### Accuracy
```
Recall: ~95-98% (with ef_search=150)
Precision: High (multi-vector weighted scoring)
```

---

## Monitoring Commands

### Check Pre-Warming Status
```sql
-- Manually trigger pre-warming (useful for testing)
SELECT * FROM prewarm_vector_indexes();

-- Check how much of indexes are in memory
SELECT 
    c.relname AS index_name,
    pg_size_pretty(pg_relation_size(c.oid)) AS index_size,
    count(*) AS blocks_in_cache,
    pg_size_pretty(count(*) * 8192) AS cache_size
FROM pg_buffercache b
JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)
WHERE c.relname LIKE '%embedding%'
GROUP BY c.relname, c.oid;
```

### Check Index Usage
```sql
SELECT 
    indexrelname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE relname = 'titles'
    AND indexrelname LIKE '%embedding%'
ORDER BY indexrelname;
```

### Check Function Configuration
```sql
-- Verify hnsw.ef_search is set
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'match_titles_by_content';
```

### Check Table Stats
```sql
SELECT 
    COUNT(*) as total_rows,
    COUNT(content_embedding) as content_filled,
    COUNT(vibe_embedding) as vibe_filled,
    COUNT(metadata_embedding) as metadata_filled,
    pg_size_pretty(pg_total_relation_size('titles')) as total_size
FROM titles;
```

### Check Security Status
```sql
-- Run Supabase performance advisor
-- https://supabase.com/dashboard/project/[project-id]/database/advisors
```

---

## Configuration Parameters

### HNSW Index Build Parameters
```sql
-- Current (good for accuracy, slightly conservative)
m = 24                    -- Graph connectivity
ef_construction = 128     -- Build quality

-- Recommended for scale (50K+ vectors)
m = 32                    -- Better connectivity
ef_construction = 80      -- Faster builds, minimal accuracy loss
```

### HNSW Query Parameters
```sql
-- Current (optimized for accuracy)
ef_search = 150           -- Search breadth (set in functions)

-- Trade-offs:
-- ef_search = 40   ->  faster queries, lower accuracy (~85-90%)
-- ef_search = 100  ->  balanced (~92-95%)
-- ef_search = 150  ->  high accuracy (~95-98%) ✅ CURRENT
-- ef_search = 250  ->  maximum accuracy, slower queries
```

---

## Troubleshooting

### Queries are slow
```sql
-- 1. Check if indexes are in memory
SELECT pg_prewarm('titles_content_embedding_1536_idx');

-- 2. Check index scan statistics
SELECT * FROM pg_stat_user_indexes 
WHERE relname = 'titles';

-- 3. Verify ef_search isn't too high
-- Should be 150 (check function definition)
```

### Results are not relevant
```sql
-- 1. Check embedding quality
SELECT COUNT(*) FROM titles WHERE content_embedding IS NULL;

-- 2. Increase ef_search (if currently < 150)
-- Already at 150, so this is optimal

-- 3. Check search threshold
-- Current: match_threshold=0.3 (in code)
-- Lower threshold = more results, less relevant
```

### Index rebuild needed
```sql
-- When: Scaling beyond 50K vectors or performance issues
-- How:
DROP INDEX titles_content_embedding_1536_idx;
CREATE INDEX titles_content_embedding_1536_idx 
ON titles USING hnsw (content_embedding vector_cosine_ops) 
WITH (m=32, ef_construction=80);

-- Repeat for vibe and metadata indexes
```

---

## Application Integration

### Current Search Flow
```javascript
// 1. Generate 3 embeddings from query
const embeddings = await generateQueryEmbeddings(query);

// 2. Run 3 parallel vector searches (uses ef_search=150)
const [contentResult, vibeResult, metadataResult] = await Promise.all([
  supabase.rpc("match_titles_by_content", { query_embedding: embeddings.content }),
  supabase.rpc("match_titles_by_vibe", { query_embedding: embeddings.vibe }),
  supabase.rpc("match_titles_by_metadata", { query_embedding: embeddings.metadata }),
]);

// 3. Merge results with weighted scoring
// 4. Apply filters (language, kind)
// 5. Re-rank (optional)
// 6. Return paginated results
```

### Key Functions
```
match_titles_by_content(vector, threshold, count)
  → Returns: { id, similarity }
  → Uses: content_embedding index
  → ef_search: 150

match_titles_by_vibe(vector, threshold, count)
  → Returns: { id, similarity }
  → Uses: vibe_embedding index
  → ef_search: 150

match_titles_by_metadata(vector, threshold, count)
  → Returns: { id, similarity }
  → Uses: metadata_embedding index
  → ef_search: 150
```

---

## Best Practices

### DO ✅
- Keep ef_search=150 for 1536-dim vectors
- Monitor index usage regularly
- Pre-warm indexes on server startup
- Use parallel searches for multiple embeddings
- Apply filters AFTER vector search (in application layer)

### DON'T ❌
- Lower ef_search below 100 (accuracy suffers)
- Rebuild indexes without testing
- Add more indexes without checking usage
- Filter before vector search (loses index benefits)
- Ignore security advisories

---

## Scaling Considerations

### Current Capacity (Free Tier)
```
Vectors: ~6K ✅
RAM: Adequate for current dataset
CPU: No bottlenecks
Storage: 505 MB (plenty of room)
```

### When to Scale

**To Small (2 GB RAM):**
- When reaching 50K vectors
- Query latency > 100ms consistently

**To Medium (4 GB RAM):**
- When reaching 100K vectors
- Multiple concurrent users

**To Large (8 GB RAM):**
- When reaching 250K vectors
- High query throughput (100+ QPS)

---

## Resources

### Documentation
- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai/vector-indexes)
- [HNSW Algorithm](https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes)
- [Going to Production](https://supabase.com/docs/guides/ai/going-to-prod)

### Tools
- Supabase Dashboard: Performance Advisor
- Supabase Dashboard: Database Query Editor
- `pg_stat_user_indexes`: Index usage statistics
- `pg_prewarm`: Index preloading

---

**Last Updated:** October 30, 2025  
**Optimization Version:** v2 (hnsw.ef_search=150 + security fixes)

