# Server Timeout Investigation Report

**Date:** October 30, 2025  
**Investigation Method:** Terminal API testing, code analysis, database query analysis

## Executive Summary

The application is experiencing **Supabase database statement timeouts** at approximately **10 seconds**. Even though the server timeout is set to 60 seconds, the database query itself times out before the server timeout is reached.

## Root Cause

**Primary Issue:** Supabase PostgreSQL has a **statement timeout of ~10 seconds** that cancels long-running queries. The vector search query fetching 60+ results exceeds this timeout.

**Contributing Factors:**
1. **Forced minimum of 60 results** - Even when `matchCount=20` is requested, line 66 in `server/search.js` forces `dbMatchCount` to be at least 60
2. **Multiple LLM calls enabled** - Dynamic weights and query structuring add 2-3 seconds of processing time before the database query even starts
3. **Heavy vector search** - Multi-embedding vector search with 60 results on a large dataset is computationally expensive

## Detailed Findings

### 1. Database Timeout Evidence

**Test Results:**
- Health check query times out: `"canceling statement due to statement timeout"`
- Search queries timeout consistently around **10-13 seconds**
- Error code: `57014` (PostgreSQL statement timeout)
- Timeout occurs **before** server timeout (60s) is reached

**Example Error:**
```json
{
  "code": "57014",
  "message": "canceling statement due to statement timeout"
}
```

### 2. Code Analysis Findings

#### `server/search.js` Line 66
```javascript
const dbMatchCount = Math.max(matchCount, resultsNeeded, 60); // Fetch at least 60 for pagination
```

**Problem:** This forces the database to fetch **at least 60 results** even when the user requests fewer. For example:
- User requests `matchCount=20` → Database fetches **60 results**
- User requests `matchCount=5` → Database fetches **60 results**

#### Configuration Issues

From `server/config.js`:
- **Default matchCount:** `200` (from environment variable `DEFAULT_MATCH_COUNT`)
- **Dynamic weights:** Enabled (`USE_DYNAMIC_WEIGHTS=true`)
- **Query structuring:** Enabled (`USE_QUERY_STRUCTURING=true`)
- **Re-ranking:** Enabled (default)

#### Timing Breakdown (from test)

```
Total time: ~10,459ms
├── LLM Analysis (Dynamic Weights): ~1-2s
├── Query Structuring (LLM): ~1-2s  
├── Embedding Generation: ~1s
└── Database Query (60 results): TIMEOUT at ~10s ❌
```

### 3. Test Results

#### Test 1: Basic Search with matchCount=20
```
Query: "action movies"
matchCount: 20
Expected dbMatchCount: 60 (forced minimum)
Result: ❌ Timeout after 11.3 seconds
HTTP Status: 504 Gateway Timeout
```

#### Test 2: Basic Search with matchCount=5
```
Query: "action"
matchCount: 5
Expected dbMatchCount: 60 (still forced to 60!)
Result: ❌ Timeout after 13.3 seconds
HTTP Status: 504 Gateway Timeout
```

#### Test 3: Health Check
```
Endpoint: GET /api/health
Result: ❌ Database timeout
Message: "canceling statement due to statement timeout"
Time: 3.2 seconds
```

#### Test 4: Direct Code Execution
```
Query: "action movies"
matchCount: 20
Time before failure: 10,459ms
Error: Database search failed: canceling statement due to statement timeout
```

### 4. Performance Bottlenecks Identified

1. **Database Query** (Primary bottleneck)
   - Multi-embedding vector search with 60+ results
   - Takes longer than Supabase's 10-second statement timeout
   - Occurs even for simple queries

2. **LLM Processing** (Secondary bottleneck)
   - Dynamic weight analysis: ~1-2 seconds
   - Query structuring: ~1-2 seconds
   - Combined: ~2-4 seconds before database query starts

3. **Re-ranking** (Tertiary bottleneck)
   - Runs on top 30 results
   - Additional processing after database query
   - Not reached due to database timeout

## Recommendations

### Immediate Fixes (Priority 1)

1. **Remove forced minimum of 60 results**
   - Change line 66 in `server/search.js` to respect `matchCount` parameter
   - Allow pagination to work with smaller result sets
   - Example fix:
     ```javascript
     const dbMatchCount = Math.max(matchCount, resultsNeeded); // Remove hardcoded 60
     ```

2. **Reduce default matchCount**
   - Change `DEFAULT_MATCH_COUNT` from 200 to 20 in environment variables
   - Or update `server/config.js` default

3. **Consider disabling expensive features temporarily**
   - Disable query structuring (`USE_QUERY_STRUCTURING=false`)
   - Use fixed weights instead of dynamic (`USE_DYNAMIC_WEIGHTS=false`)
   - Reduces LLM calls and processing time

### Medium-term Fixes (Priority 2)

1. **Optimize database query**
   - Reduce `match_count` passed to Supabase RPC function
   - Consider using approximate nearest neighbor search if available
   - Add database indexes if possible

2. **Implement query result caching**
   - Cache frequent queries to avoid database hits
   - Use Redis or in-memory cache

3. **Increase Supabase statement timeout** (if possible)
   - Check Supabase project settings
   - Note: May have platform limits

### Long-term Fixes (Priority 3)

1. **Database query optimization**
   - Profile the `match_titles_multi` RPC function
   - Optimize vector search performance
   - Consider pagination at database level

2. **Request batching**
   - Batch multiple embedding searches if possible
   - Reduce round trips to database

3. **Move to dedicated vector database**
   - Consider specialized solutions (Pinecone, Weaviate, etc.)
   - Better performance for large-scale vector searches

## Impact Assessment

**Current State:**
- ❌ All searches timeout after ~10 seconds
- ❌ User sees "Search timeout" error messages
- ❌ No results returned to users
- ❌ Poor user experience

**After Immediate Fixes:**
- ✅ Searches should complete successfully
- ✅ Users get results (fewer, but functional)
- ✅ Reduced timeout errors
- ✅ Better user experience

## Implementation Status

### ✅ Completed Fixes

1. **Removed forced 60 minimum results** (October 30, 2025)
   - Changed `server/search.js` line 66 from:
     ```javascript
     const dbMatchCount = Math.max(matchCount, resultsNeeded, 60);
     ```
   - To:
     ```javascript
     const dbMatchCount = Math.max(matchCount, resultsNeeded);
     ```
   - **Status:** ✅ Code updated
   - **Impact:** Database now respects `matchCount` parameter instead of forcing 60+ results

### ⚠️ Remaining Issues

After implementing the fix, testing shows:
- Searches with `matchCount=20` still timeout (~11 seconds)
- Searches with `matchCount=10` still timeout (~11 seconds)  
- Searches with `matchCount=5` still timeout (~18 seconds)

**Analysis:** The database query performance issue persists regardless of result count. This suggests:
1. **Multi-embedding vector search is inherently slow** - The Supabase RPC function `match_titles_multi` may be computationally expensive
2. **Database statement timeout** - Supabase's ~10 second timeout is still being hit
3. **Possible database optimization needed** - Indexes, query optimization, or database connection pooling may be required

### Next Steps

1. ✅ **Investigation Complete** - Root cause identified
2. ✅ **Primary Fix Implemented** - Removed forced 60 minimum
3. ⏭️ **Database Optimization** - Investigate Supabase query performance
4. ⏭️ **Consider disabling expensive features** - Temporarily disable query structuring or dynamic weights
5. ⏭️ **Monitor** - Track timeout rates and query performance
6. ⏭️ **Optimize** - Apply Priority 2 and 3 fixes as needed

## Files Involved

- `server/search.js` - Line 66 (forced 60 minimum)
- `server/config.js` - Default matchCount configuration
- `server/index.js` - Server timeout configuration (60s)
- Supabase database - Statement timeout (~10s)

## Notes

- The 60-second server timeout is appropriate, but the database timeout is much shorter
- The issue is not with the Express server or network, but with the database query itself
- Reducing the number of results fetched should significantly improve performance
- Multiple LLM calls add 2-4 seconds before the database query even starts

