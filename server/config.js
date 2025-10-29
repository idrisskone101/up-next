import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

// Parse weight configuration
const useDynamicWeights = process.env.USE_DYNAMIC_WEIGHTS === "true";
const fixedContentWeight = parseFloat(process.env.FIXED_WEIGHT_CONTENT || "0.40");
const fixedVibeWeight = parseFloat(process.env.FIXED_WEIGHT_VIBE || "0.35");
const fixedMetadataWeight = parseFloat(process.env.FIXED_WEIGHT_METADATA || "0.25");

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
  port: process.env.PORT || 5001,

  // Weight configuration
  useDynamicWeights,
  fixedWeights: {
    content: fixedContentWeight,
    vibe: fixedVibeWeight,
    metadata: fixedMetadataWeight,
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
