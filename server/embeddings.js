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
  const systemPrompt = `You analyze queries for a movie/TV semantic search with three embedding types:

CONTENT: Story/plot (themes, narrative, character arcs)
VIBE: Emotional feel (mood, tone, pacing, atmosphere)
METADATA: Categories (genres, actors, directors, keywords)

CRITICAL RULE: Vibe must NEVER go below 0.25. Movies are emotional experiences.

GENRE → VIBE MAPPINGS (use these exact vibe terms):
- romance → romantic, heartwarming, sentimental
- comedy → lighthearted, playful, comedic, whimsical
- horror → dark, tense, suspenseful, atmospheric
- thriller → tense, suspenseful, thrilling, intense
- drama → earnest, melancholic, bittersweet, somber
- action → intense, kinetic, energetic, thrilling
- adventure → epic, energetic, uplifting
- animation → whimsical, playful, heartwarming
- family → heartwarming, uplifting, lighthearted
- fantasy → dreamy, whimsical, epic, surreal
- sci-fi → atmospheric, trippy, surreal, intense
- crime → gritty, noir, dark, tense
- mystery → atmospheric, suspenseful, brooding
- documentary → earnest, somber
- war → gritty, intense, somber, epic
- western → gritty, atmospheric, epic

SEASONAL/THEMATIC → VIBE MAPPINGS:
- fall/autumn → melancholic, cozy, atmospheric, bittersweet
- summer → energetic, lighthearted, uplifting
- noir → dark, brooding, cynical, atmospheric
- indie → earnest, melancholic, whimsical

KEY INSIGHT: When a query mentions a genre, it implies BOTH metadata AND vibe.
"summer action flicks" = summer keyword (metadata) + action genre (metadata) + energetic/thrilling vibes

WEIGHTING GUIDELINES:
- Plot/theme queries ("movies about X") → content: 0.50, vibe: 0.30, metadata: 0.20
- Pure vibe queries ("something cozy") → vibe: 0.55, content: 0.25, metadata: 0.20
- Genre+feeling queries ("rom-coms", "horror") → vibe: 0.40, metadata: 0.35, content: 0.25
- Seasonal+genre ("summer thrillers", "fall dramas") → vibe: 0.40, metadata: 0.35, content: 0.25
- Seasonal+vibe ("cozy fall movies") → vibe: 0.50, metadata: 0.25, content: 0.25
- Director/actor queries → metadata: 0.50, vibe: 0.25, content: 0.25
- Ambiguous → balanced (0.35, 0.35, 0.30)

EXAMPLES:
- "summer action movies" → vibe: 0.40, metadata: 0.35, content: 0.25
  (implies: energetic, thrilling, intense vibes)
- "cozy fall movies" → vibe: 0.50, metadata: 0.25, content: 0.25
  (implies: cozy, melancholic, atmospheric vibes)
- "movies about revenge" → content: 0.50, vibe: 0.30, metadata: 0.20
- "dark psychological thrillers" → vibe: 0.45, metadata: 0.30, content: 0.25
  (implies: dark, tense, intense, brooding vibes)
- "Nolan films" → metadata: 0.50, vibe: 0.25, content: 0.25
- "feel-good comedies" → vibe: 0.50, metadata: 0.30, content: 0.20
  (implies: lighthearted, uplifting, comedic vibes)

Return ONLY valid JSON:
{
  "content": 0.XX,
  "vibe": 0.XX,
  "metadata": 0.XX,
  "reasoning": "Brief explanation"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
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

// Standardized schema values - MUST match database enrichment exactly
const VIBE_DIMENSIONS = [
  "cozy", "whimsical", "lighthearted", "romantic", "heartwarming", "sentimental",
  "earnest", "uplifting", "melancholic", "bittersweet", "somber", "brooding",
  "dark", "gritty", "noir", "atmospheric", "dreamy", "surreal", "trippy",
  "tense", "suspenseful", "thrilling", "intense", "chaotic", "kinetic",
  "energetic", "epic", "playful", "campy", "satirical", "absurdist", "comedic",
  "cynical", "bleak", "rebellious", "subversive"
];

const TONES = [
  "serious", "earnest", "hopeful", "bleak", "grim", "cynical", "optimistic",
  "playful", "humorous", "sarcastic", "satirical", "dramatic", "melancholic",
  "poetic", "noir", "whimsical", "philosophical", "intense"
];

const PACING = ["ultra-slow", "slow-burn", "moderate", "fast-paced", "hyper-kinetic"];

/**
 * Structures a user query into expanded formats matching the original database embedding structure
 * Uses GPT-4o-mini to expand lazy queries like "Cosy Night In" into proper structured text
 * that matches how the original vectors were created
 *
 * CRITICAL: The vibe text format MUST match text-builders.js exactly:
 * - Vibes with score >= 0.8 are DOUBLED (e.g., "cozy cozy")
 * - Vibes with score 0.3-0.79 appear once
 * - Only use standardized vibe/tone/pacing values
 *
 * @param {string} query - The user's raw search query
 * @returns {Promise<{content: string, vibe: string, metadata: string}>}
 */
export async function structureQuery(query) {
  const systemPrompt = `You are a query structurer for a movie/TV semantic search system. Your task is to expand user queries into formats that EXACTLY match how the database embeddings were created.

CRITICAL: The database uses ONLY these standardized values:

VIBES (pick relevant ones, assign scores 0.0-1.0):
${VIBE_DIMENSIONS.join(", ")}

TONES (pick exactly ONE):
${TONES.join(", ")}

PACING (pick exactly ONE):
${PACING.join(", ")}

VIBE TEXT FORMAT (MUST match exactly):
- For each vibe with score >= 0.8: DOUBLE the word (e.g., "cozy cozy")
- For each vibe with score 0.3-0.79: single word
- Sort by score descending
- Format: "Vibes: [vibes]. Tone: [tone]. Pacing: [pacing]"

EXAMPLES - follow these patterns:

Cozy romantic query ("cozy date night"):
"Vibes: cozy cozy, heartwarming heartwarming, romantic, lighthearted, sentimental
Tone: hopeful
Pacing: moderate"

Anti-establishment/satirical query ("angry at capitalism", "eat the rich", "corporate dystopia"):
"Vibes: satirical satirical, dark dark, gritty, cynical, absurdist, atmospheric
Tone: cynical
Pacing: moderate"

Noir/atmospheric query ("moody detective vibes", "rainy city nights"):
"Vibes: noir noir, atmospheric atmospheric, dark, brooding, melancholic, tense
Tone: noir
Pacing: slow-burn"

Chaotic/unhinged query ("unhinged energy", "chaotic mess"):
"Vibes: chaotic chaotic, absurdist, dark, energetic, kinetic, playful
Tone: sarcastic
Pacing: fast-paced"

CONTENT embedding format:
"Story: [one-sentence logline]
Themes: [comma-separated themes]
Overview: [2-3 sentence description]
Keywords: [comma-separated keywords]"

METADATA embedding format:
"Type: [film or television series]
Genres: [comma-separated genres]
Director: [style or names]
Rating: [PG, PG-13, R, TV-MA, etc.]"

Return ONLY valid JSON:
{
  "content": "[content text as described above]",
  "vibe": "[vibe text with doubled high-score vibes as described above]",
  "metadata": "[metadata text as described above]",
  "vibeScores": {"vibe1": 0.9, "vibe2": 0.7, ...}
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
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
 * Creates fallback template text when query structuring is disabled or fails
 * @param {string} query - Raw query string
 * @returns {{content: string, vibe: string, metadata: string}}
 */
export function createFallbackStructuredText(query) {
  return {
    content: `Story: ${query}. Overview: ${query}. Themes: ${query}. Plot: ${query}`,
    vibe: `Vibes: ${query}. Mood: ${query}. Tone: ${query}. Atmosphere: ${query}. Feeling: ${query}`,
    metadata: `Genres: ${query}. Keywords: ${query}. Similar to: ${query}. Category: ${query}`,
  };
}

/**
 * Generates embeddings from pre-structured text (for parallel processing)
 * Use this when you already have structured query text from structureQuery()
 *
 * @param {{content: string, vibe: string, metadata: string}} structuredText
 * @returns {Promise<{content: number[], vibe: number[], metadata: number[]}>}
 */
export async function generateEmbeddingsFromStructured(structuredText) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      dimensions: 1536,
      input: [structuredText.content, structuredText.vibe, structuredText.metadata],
      encoding_format: "float",
    });

    return {
      content: response.data[0].embedding,
      vibe: response.data[1].embedding,
      metadata: response.data[2].embedding,
    };
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Failed to generate embeddings from structured text");
  }
}

/**
 * Generates three separate embeddings for a query, formatted for each embedding type
 * Note: For parallel processing, use structureQuery() + generateEmbeddingsFromStructured() separately
 *
 * @param {string} query - The user's search query
 * @returns {Promise<{content: number[], vibe: number[], metadata: number[]}>}
 */
export async function generateQueryEmbeddings(query) {
  let texts;

  if (config.useQueryStructuring) {
    try {
      console.log("[Embeddings] Structuring query with LLM...");
      const structured = await structureQuery(query);
      texts = structured;
      console.log("[Embeddings] Query structured successfully");
    } catch (error) {
      console.warn("[Embeddings] Query structuring failed, falling back to template method:", error.message);
      texts = createFallbackStructuredText(query);
    }
  } else {
    texts = createFallbackStructuredText(query);
  }

  return generateEmbeddingsFromStructured(texts);
}
