import OpenAI from "openai";
import { config } from "./config.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Analyzes user query intent and calculates optimal weights for each embedding type
 * Uses GPT-4o-mini to determine whether query focuses on content, vibe, or metadata
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
    // Return default weights as fallback
    return {
      content: 0.4,
      vibe: 0.35,
      metadata: 0.25,
      reasoning: "Using default balanced weights (LLM analysis failed)",
    };
  }
}

/**
 * Generates three separate embeddings for a query, formatted for each embedding type
 *
 * @param {string} query - The user's search query
 * @returns {Promise<{content: number[], vibe: number[], metadata: number[]}>}
 */
export async function generateQueryEmbeddings(query) {
  // Format query differently for each embedding type to match how database was built
  const texts = {
    content: `Story: ${query}. Overview: ${query}. Themes: ${query}`,
    vibe: `Vibes: ${query}. Tone: ${query}. Tagline: ${query}`,
    metadata: `Genres: ${query}. Type: ${query}. Keywords: ${query}`,
  };

  try {
    // Generate all 3 embeddings in a single API call for efficiency
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
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
