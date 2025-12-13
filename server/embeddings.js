import OpenAI from "openai";
import { config } from "./config.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Returns fixed weights from configuration
 * Used when USE_DYNAMIC_WEIGHTS is false for faster, consistent searches
 *
 * @returns {{content: number, vibe: number, metadata: number, reasoning: string}}
 */
export function getFixedWeights() {
  return {
    content: config.fixedWeights.content,
    vibe: config.fixedWeights.vibe,
    metadata: config.fixedWeights.metadata,
    reasoning: "Using fixed weights from configuration",
  };
}

/**
 * Analyzes user query intent and calculates optimal weights for each embedding type
 * Uses GPT-4o-mini to determine whether query focuses on content, vibe, or metadata
 * NOTE: Only called when USE_DYNAMIC_WEIGHTS is true
 *
 * @param {string} query - The user's search query
 * @returns {Promise<{content: number, vibe: number, metadata: number, reasoning: string}>}
 */
export async function analyzeQueryIntent(query) {
  const systemPrompt = `You are a query analyzer for a movie/TV semantic search system with three embedding types:

1. CONTENT embedding: Captures story/plot elements
   - Narrative themes (revenge, redemption, coming-of-age)
   - Story structure (time travel, heist, mystery)
   - Character arcs and relationships

2. VIBE embedding: Captures emotional/atmospheric qualities
   - Mood and feeling (cozy, dark, whimsical, gritty)
   - Tone (earnest, melancholic, campy, noir)
   - Pacing (slow-burn, kinetic, contemplative)

3. METADATA embedding: Captures factual/categorical information
   - Genres (superhero, comedy, thriller)
   - Directors and creators
   - Actors, years, ratings

WEIGHTING RULES:
- Genre/franchise/director/actor mentions → prioritize METADATA (0.5-0.7)
- Plot/story/theme descriptions → prioritize CONTENT (0.5-0.7)
- Mood/feeling/atmosphere adjectives → prioritize VIBE (0.5-0.7)
- Hybrid queries → distribute proportionally
- Ambiguous → default balanced (0.4, 0.35, 0.25)

Return ONLY valid JSON:
{
  "content": 0.XX,
  "vibe": 0.XX,
  "metadata": 0.XX,
  "reasoning": "Brief explanation"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this query: "${query}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 150,
    });

    const result = JSON.parse(response.choices[0].message.content);

    // Validate and normalize weights to ensure they sum to 1.0
    const sum = result.content + result.vibe + result.metadata;
    if (Math.abs(sum - 1.0) > 0.01) {
      result.content /= sum;
      result.vibe /= sum;
      result.metadata /= sum;
    }

    return result;
  } catch (error) {
    console.error("LLM weight analysis failed:", error);
    // Fallback to configured fixed weights
    return getFixedWeights();
  }
}

/**
 * Structures a user query into expanded formats matching the original database embedding structure
 * Uses GPT-4o-mini to expand lazy queries like "Cosy Night In" into proper structured text
 * that matches how the original vectors were created
 *
 * @param {string} query - The user's raw search query
 * @returns {Promise<{content: string, vibe: string, metadata: string}>}
 */
export async function structureQuery(query) {
  const systemPrompt = `You are a query structurer for a movie/TV semantic search system. Your task is to expand and structure user queries into formats that match how the original database embeddings were created.

The database has three embedding types built from these fields:

1. CONTENT embedding (built from: profile_string, themes, overview, slots, keywords)
   - profile_string: One-sentence spoiler-safe logline
   - themes: Array of narrative themes (e.g., ["revenge", "coming-of-age"])
   - overview: 2-3 sentence plot description
   - slots: Story structure elements (protagonist, setting, goal, obstacle, stakes)
   - keywords: Relevant story keywords

2. VIBE embedding (built from: vibes, tone, pacing, tagline)
   - vibes: Array of mood descriptors (e.g., ["cozy", "dark", "whimsical"])
   - tone: Single tone descriptor (e.g., "earnest", "melancholic", "noir")
   - pacing: Single pacing descriptor (e.g., "slow-burn", "kinetic", "contemplative")
   - tagline: Marketing tagline or atmospheric one-liner

3. METADATA embedding (built from: genres, director, writers, certification, production_countries, collection)
   - genres: Array of genre names (e.g., ["drama", "romance", "comedy"])
   - director: Director name or style description
   - writers: Writer names or style descriptions
   - certification: Age rating (e.g., "PG-13", "R", "TV-MA")
   - production_countries: Country codes or names
   - collection: Franchise or series name

INSTRUCTIONS:
- Expand the user's query while preserving their intent
- Generate structured text for each embedding type matching the database format
- Be creative but accurate - infer what the user likely wants
- For Content: Create a profile_string-style logline, themes, overview, story structure hints, keywords
- For Vibe: Extract mood descriptors, determine tone and pacing, create tagline
- For Metadata: Suggest genres, determine type (movie/tv), director/writer styles, appropriate rating, countries, collections

Return ONLY valid JSON:
{
  "content": "Profile: [one-sentence logline]. Overview: [2-3 sentence description]. Themes: [comma-separated themes]. Story structure: [brief structure elements]. Keywords: [comma-separated keywords]",
  "vibe": "Vibes: [comma-separated vibes]. Tone: [single tone descriptor]. Pacing: [single pacing descriptor]. Tagline: [atmospheric tagline]",
  "metadata": "Genres: [comma-separated genres]. Director: [suggested director style or names]. Writers: [suggested writer styles]. Certification: [appropriate rating]. Countries: [relevant countries]. Collection: [relevant franchises/series]"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Structure this query: "${query}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      content: result.content || "",
      vibe: result.vibe || "",
      metadata: result.metadata || "",
    };
  } catch (error) {
    console.error("LLM query structuring failed:", error);
    // Return empty structured query to trigger fallback
    throw error;
  }
}

/**
 * Generates a single embedding for a query (raw query text)
 * This is used with match_titles_multi RPC which compares the same embedding
 * against all three database embedding types
 *
 * @param {string} query - The user's search query
 * @returns {Promise<number[]>} - Single 1536-dimensional embedding
 */
export async function generateQueryEmbedding(query) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      dimensions: 1536,
      input: query,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Failed to generate query embedding");
  }
}

/**
 * Generates three separate embeddings for a query, formatted for each embedding type
 * @deprecated Use generateQueryEmbedding() instead with match_titles_multi RPC
 *
 * @param {string} query - The user's search query
 * @returns {Promise<{content: number[], vibe: number[], metadata: number[]}>}
 */
export async function generateQueryEmbeddings(query) {
  let texts;

  // Optionally structure query using LLM if enabled
  if (config.useQueryStructuring) {
    try {
      console.log("[Embeddings] Structuring query with LLM...");
      const structured = await structureQuery(query);
      // Use structured texts directly (already in correct format)
      texts = {
        content: structured.content,
        vibe: structured.vibe,
        metadata: structured.metadata,
      };
      console.log("[Embeddings] Query structured successfully");
    } catch (error) {
      console.warn("[Embeddings] Query structuring failed, falling back to template method:", error.message);
      // Fallback to template repetition method
      texts = {
        content: `Story: ${query}. Overview: ${query}. Themes: ${query}`,
        vibe: `Vibes: ${query}. Tone: ${query}. Tagline: ${query}`,
        metadata: `Genres: ${query}. Type: ${query}. Keywords: ${query}`,
      };
    }
  } else {
    // Format query differently for each embedding type to match how database was built
    texts = {
      content: `Story: ${query}. Overview: ${query}. Themes: ${query}`,
      vibe: `Vibes: ${query}. Tone: ${query}. Tagline: ${query}`,
      metadata: `Genres: ${query}. Type: ${query}. Keywords: ${query}`,
    };
  }

  try {
    // Generate all 3 embeddings in a single API call for efficiency
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      dimensions: 1536,
      input: [texts.content, texts.vibe, texts.metadata],
      encoding_format: "float",
    });

    return {
      content: response.data[0].embedding,
      vibe: response.data[1].embedding,
      metadata: response.data[2].embedding,
    };
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Failed to generate query embeddings");
  }
}
