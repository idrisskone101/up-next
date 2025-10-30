import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

// Parse weight configuration
const useDynamicWeights = process.env.USE_DYNAMIC_WEIGHTS === "true";
const fixedContentWeight = parseFloat(process.env.FIXED_WEIGHT_CONTENT || "0.40");
const fixedVibeWeight = parseFloat(process.env.FIXED_WEIGHT_VIBE || "0.35");
const fixedMetadataWeight = parseFloat(process.env.FIXED_WEIGHT_METADATA || "0.25");

// Parse re-ranking configuration
const enableReranking = process.env.ENABLE_RERANKING !== "false"; // Default ON
const rerankWeightSemantic = parseFloat(process.env.RERANK_WEIGHT_SEMANTIC || "0.75");
const rerankWeightQuality = parseFloat(process.env.RERANK_WEIGHT_QUALITY || "0.15");
const rerankWeightPopularity = parseFloat(process.env.RERANK_WEIGHT_POPULARITY || "0.05");
const rerankWeightRecency = parseFloat(process.env.RERANK_WEIGHT_RECENCY || "0.05");
const rerankMaxSameCollection = parseInt(process.env.RERANK_MAX_SAME_COLLECTION || "2", 10);
const rerankMaxSameDirector = parseInt(process.env.RERANK_MAX_SAME_DIRECTOR || "3", 10);
const rerankCompletenessThreshold = parseFloat(process.env.RERANK_COMPLETENESS_THRESHOLD || "0.85");

// Parse query structuring configuration
const useQueryStructuring = process.env.USE_QUERY_STRUCTURING === "true"; // Default OFF

// Parse search configuration
const defaultMatchCount = parseInt(process.env.DEFAULT_MATCH_COUNT || "20", 10);
const defaultMatchThreshold = parseFloat(process.env.DEFAULT_MATCH_THRESHOLD || "0.4");

// Validate that fixed weights sum to 1.0 (within tolerance)
const weightSum = fixedContentWeight + fixedVibeWeight + fixedMetadataWeight;
if (Math.abs(weightSum - 1.0) > 0.01) {
  console.error(`Error: Fixed weights must sum to 1.0 (currently: ${weightSum.toFixed(2)})`);
  console.error(`  FIXED_WEIGHT_CONTENT: ${fixedContentWeight.toFixed(2)}`);
  console.error(`  FIXED_WEIGHT_VIBE: ${fixedVibeWeight.toFixed(2)}`);
  console.error(`  FIXED_WEIGHT_METADATA: ${fixedMetadataWeight.toFixed(2)}`);
  process.exit(1);
}

// Validate that re-ranking weights sum to 1.0 (within tolerance)
const rerankWeightSum = rerankWeightSemantic + rerankWeightQuality + rerankWeightPopularity + rerankWeightRecency;
if (Math.abs(rerankWeightSum - 1.0) > 0.01) {
  console.error(`Error: Re-ranking weights must sum to 1.0 (currently: ${rerankWeightSum.toFixed(2)})`);
  console.error(`  RERANK_WEIGHT_SEMANTIC: ${rerankWeightSemantic.toFixed(2)}`);
  console.error(`  RERANK_WEIGHT_QUALITY: ${rerankWeightQuality.toFixed(2)}`);
  console.error(`  RERANK_WEIGHT_POPULARITY: ${rerankWeightPopularity.toFixed(2)}`);
  console.error(`  RERANK_WEIGHT_RECENCY: ${rerankWeightRecency.toFixed(2)}`);
  process.exit(1);
}

// Export configuration
export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  tmdbToken: process.env.TMDB_TOKEN,
  port: process.env.PORT || 5001,

  // Weight configuration
  useDynamicWeights,
  fixedWeights: {
    content: fixedContentWeight,
    vibe: fixedVibeWeight,
    metadata: fixedMetadataWeight,
  },

  // Re-ranking configuration
  enableReranking,
  rerankingWeights: {
    semantic: rerankWeightSemantic,
    quality: rerankWeightQuality,
    popularity: rerankWeightPopularity,
    recency: rerankWeightRecency,
  },
  diversity: {
    maxSameCollection: rerankMaxSameCollection,
    maxSameDirector: rerankMaxSameDirector,
    penaltyFactor: 0.85, // Hardcoded for now
  },
  completenessThreshold: rerankCompletenessThreshold,

  // Query structuring configuration
  useQueryStructuring,

  // Search configuration
  search: {
    defaultMatchCount,
    defaultMatchThreshold,
  },
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
console.log(`\n🎯 Re-ranking: ${enableReranking ? "ENABLED" : "DISABLED"}`);
if (enableReranking) {
  console.log(`   Semantic:    ${rerankWeightSemantic.toFixed(2)}`);
  console.log(`   Quality:     ${rerankWeightQuality.toFixed(2)}`);
  console.log(`   Popularity:  ${rerankWeightPopularity.toFixed(2)}`);
  console.log(`   Recency:     ${rerankWeightRecency.toFixed(2)}`);
  console.log(`   Diversity:   Max ${rerankMaxSameCollection} same collection, ${rerankMaxSameDirector} same director`);
}

// Log query structuring configuration on startup
console.log(`\n🔧 Query Structuring: ${useQueryStructuring ? "ENABLED" : "DISABLED"}`);

// Log search configuration on startup
console.log(`\n🔍 Search Defaults: matchCount=${defaultMatchCount}, matchThreshold=${defaultMatchThreshold.toFixed(2)}`);
