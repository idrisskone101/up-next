import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

// Parse weight configuration
const useDynamicWeights = process.env.USE_DYNAMIC_WEIGHTS === "true";
const fixedContentWeight = parseFloat(process.env.FIXED_WEIGHT_CONTENT || "0.40");
const fixedVibeWeight = parseFloat(process.env.FIXED_WEIGHT_VIBE || "0.35");
const fixedMetadataWeight = parseFloat(process.env.FIXED_WEIGHT_METADATA || "0.25");
const fixedPopularityWeight = parseFloat(process.env.FIXED_WEIGHT_POPULARITY || "0");

// Parse re-ranking configuration (recency + animation + low-vote penalty)
const enableReranking = process.env.ENABLE_RERANKING !== "false"; // Default ON

// Parse vibe conflict filter configuration
const enableVibeConflictFilter = process.env.ENABLE_VIBE_CONFLICT_FILTER !== "false"; // Default ON

// Parse query structuring configuration
const useQueryStructuring = process.env.USE_QUERY_STRUCTURING === "true"; // Default OFF

// Parse search configuration
const defaultMatchCount = parseInt(process.env.DEFAULT_MATCH_COUNT || "60", 10);
const defaultMatchThreshold = parseFloat(process.env.DEFAULT_MATCH_THRESHOLD || "0");

// Parse cache configuration
const enableSearchCache = process.env.ENABLE_SEARCH_CACHE !== "false"; // Default ON
const searchCacheTtlMinutes = parseInt(process.env.SEARCH_CACHE_TTL_MINUTES || "5", 10);
const embeddingCacheTtlMinutes = parseInt(process.env.EMBEDDING_CACHE_TTL_MINUTES || "30", 10);

// Validate that fixed weights sum to 1.0 (within tolerance)
const weightSum = fixedContentWeight + fixedVibeWeight + fixedMetadataWeight;
if (Math.abs(weightSum - 1.0) > 0.01) {
  console.error(`Error: Fixed weights must sum to 1.0 (currently: ${weightSum.toFixed(2)})`);
  console.error(`  FIXED_WEIGHT_CONTENT: ${fixedContentWeight.toFixed(2)}`);
  console.error(`  FIXED_WEIGHT_VIBE: ${fixedVibeWeight.toFixed(2)}`);
  console.error(`  FIXED_WEIGHT_METADATA: ${fixedMetadataWeight.toFixed(2)}`);
  process.exit(1);
}


// Export configuration
export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  tmdbToken: process.env.TMDB_TOKEN,
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  port: process.env.PORT || 5001,

  // Weight configuration
  useDynamicWeights,
  fixedWeights: {
    content: fixedContentWeight,
    vibe: fixedVibeWeight,
    metadata: fixedMetadataWeight,
    popularity: fixedPopularityWeight,
  },

  // Re-ranking configuration (recency + animation + low-vote penalty)
  enableReranking,

  // Vibe conflict filter configuration
  enableVibeConflictFilter,

  // Query structuring configuration
  useQueryStructuring,

  // Search configuration
  search: {
    defaultMatchCount,
    defaultMatchThreshold,
  },

  // Cache configuration
  enableSearchCache,
  searchCacheTtlMinutes,
  embeddingCacheTtlMinutes,
};

// Validate required environment variables
const requiredEnvVars = ["OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Log weight configuration on startup
console.log(`\n⚖️  Weight Mode: ${useDynamicWeights ? "DYNAMIC (LLM-based)" : "FIXED"}`);
if (!useDynamicWeights) {
  console.log(`   Content:  ${fixedContentWeight.toFixed(2)}`);
  console.log(`   Vibe:     ${fixedVibeWeight.toFixed(2)}`);
  console.log(`   Metadata: ${fixedMetadataWeight.toFixed(2)}`);
}

// Log re-ranking configuration on startup
console.log(`\n🎯 Re-ranking: ${enableReranking ? "ENABLED (recency + animation + low-vote penalty)" : "DISABLED"}`);

// Log vibe conflict filter configuration on startup
console.log(`\n🎭 Vibe Conflict Filter: ${enableVibeConflictFilter ? "ENABLED (auto-excludes tonal conflicts)" : "DISABLED"}`);

// Log query structuring configuration on startup
console.log(`\n🔧 Query Structuring: ${useQueryStructuring ? "ENABLED" : "DISABLED"}`);

// Log search configuration on startup
console.log(`\n🔍 Search Defaults: matchCount=${defaultMatchCount}, matchThreshold=${defaultMatchThreshold.toFixed(2)}`);

// Log cache configuration on startup
console.log(`\n💾 Cache: ${enableSearchCache ? `ENABLED (results: ${searchCacheTtlMinutes}min, embeddings: ${embeddingCacheTtlMinutes}min)` : "DISABLED"}`);
