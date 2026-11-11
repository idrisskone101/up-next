import dotenv from "dotenv";

dotenv.config();

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || "gpt-6-luna",
  reasoningEffort: process.env.REASONING_EFFORT || "low",
  serviceTier: process.env.OPENAI_SERVICE_TIER || "priority",
  tmdbToken: process.env.TMDB_TOKEN,
  port: process.env.PORT || 5001,
  searchCacheTtlMinutes: parseInt(process.env.SEARCH_CACHE_TTL_MINUTES || "30", 10),
};

for (const envVar of ["OPENAI_API_KEY", "TMDB_TOKEN"]) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

console.log(`\n🤖 Model: ${config.openaiModel} (reasoning effort: ${config.reasoningEffort}, service tier: ${config.serviceTier})`);
console.log(`💾 Search cache TTL: ${config.searchCacheTtlMinutes}min`);
