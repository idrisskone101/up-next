import OpenAI from "openai";
import { config } from "./config.js";
import { TTLCache } from "./cache.js";
import { findTitle, getTitleDetails } from "./tmdb.js";

const openai = new OpenAI({ apiKey: config.openaiApiKey });
const cache = new TTLCache(config.searchCacheTtlMinutes, "search");
setInterval(() => cache.prune(), 10 * 60 * 1000).unref();

const SUGGESTION_COUNT = 20;

const SYSTEM_PROMPT = `You are upNext's film & TV curator: a deeply well-watched video store clerk with a critic's taste. Given a viewer's request, recommend titles they will genuinely love.

Reading the request:
- It may describe a mood/vibe ("cozy rainy-day"), a plot or theme ("heists gone wrong"), a genre, a person (actor, director, creator), an era, a setting, a season or occasion, or a comparison ("like Severance but funnier"). Satisfy every constraint it states at once, not just the loudest one.
- Tone words matter as much as genre: "dark comedy" is not "feel-good comedy"; "scary" means genuinely frightening.
- Read through typos and slang ("nolen" means Christopher Nolan).
- If it names a title ("like X"), recommend titles that share its feel, themes and appeal. Never include X itself or its sequels, prequels or remakes.
- If it asks for a person's work ("Greta Gerwig movies"), list the titles they're known for in that role (directed, starred in, created), best first, including every franchise entry. Don't pad with producer-only credits, cameos or shorts.

Choosing titles:
- Only real, already-released titles that exist on TMDB. Never invent or misremember titles.
- Think broadly first, then keep only the strongest. Lead with the canonical, well-loved titles a knowledgeable fan would expect; missing an obvious classic is a worse failure than omitting an obscure pick.
- Every pick must clearly fit and be worth watching; never pad with weak, tangential or widely panned titles.
- Aim for ${SUGGESTION_COUNT} titles. Return fewer only when the real-world pool is small (one person's filmography, a tiny niche). Stacked qualifiers ("80s sci-fi comedies with a road trip") are not narrow: fill the list with titles that nail the core ask and clearly nod to the rest.
- Mix crowd-pleasers with a few lesser-known gems that fit just as well.
- Rank strictly by fit, best first; the first five are the picks you'd bet your reputation on.
- At most one entry per franchise unless the request is about that franchise.
- Exclude documentaries, docuseries, reality TV, stand-up specials, concert films and kids' cartoons unless the request asks for them.
- Prefer English-language titles unless the request suggests otherwise; acclaimed international titles are welcome when they fit strongly.

For each title return:
- title: official English title as listed on TMDB, without the year.
- year: original release year (for TV, the first-air year).
- kind: "movie" or "tv".
- reason: one specific sentence (max 20 words) on why it fits THIS request. Name the concrete quality that matches; don't summarize the plot.`;

const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "suggestions",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["suggestions"],
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "year", "kind", "reason"],
            properties: {
              title: { type: "string" },
              year: { type: "integer" },
              kind: { type: "string", enum: ["movie", "tv"] },
              reason: { type: "string" },
            },
          },
        },
      },
    },
  },
};

function describeFilters({ kindFilter, minReleaseYear }) {
  const kinds = kindFilter?.length === 1
    ? (kindFilter[0] === "tv" ? "TV series only." : "Movies only.")
    : "Movies or TV series, whichever fits the request best.";
  const year = minReleaseYear ? ` Only titles released in ${minReleaseYear} or later.` : "";
  return kinds + year;
}

async function askModel(request, filters) {
  const startTime = Date.now();
  const response = await openai.chat.completions.create({
    model: config.openaiModel,
    reasoning_effort: config.reasoningEffort,
    service_tier: config.serviceTier,
    response_format: RESPONSE_FORMAT,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${request}\n\nConstraints: ${describeFilters(filters)}\nReturn up to ${SUGGESTION_COUNT} titles.`,
      },
    ],
  });
  const { suggestions } = JSON.parse(response.choices[0].message.content);
  console.log(`[LLM] ${config.openaiModel} returned ${suggestions.length} suggestions in ${Date.now() - startTime}ms`);
  return suggestions;
}

/**
 * Resolve LLM suggestions against TMDB, drop anything unmatched, duplicated or outside the filters.
 */
async function hydrate(suggestions, { kindFilter, minReleaseYear, excludeGenres }, excludeKey = null) {
  const startTime = Date.now();
  const excluded = new Set((excludeGenres || []).map((g) => g.toLowerCase()));

  const resolved = await Promise.all(
    suggestions.map(async (s) => {
      try {
        // The model sometimes mislabels miniseries/TV movies, so fall back to the other kind
        const otherKind = s.kind === "tv" ? "movie" : "tv";
        let kind = s.kind;
        let id = await findTitle(s.title, s.year, kind);
        if (!id) {
          kind = otherKind;
          id = await findTitle(s.title, s.year, kind);
        }
        if (!id) {
          console.log(`[TMDB] No match for "${s.title}" (${s.year}, ${s.kind})`);
          return null;
        }
        const details = await getTitleDetails(id, kind);
        return { ...details, reason: s.reason };
      } catch (error) {
        console.warn(`[TMDB] Failed to resolve "${s.title}":`, error.message);
        return null;
      }
    }),
  );

  const seen = new Set(excludeKey ? [excludeKey] : []);
  const matches = resolved.filter((t) => {
    if (!t) return false;
    const key = `${t.kind}:${t.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (kindFilter?.length && !kindFilter.includes(t.kind)) return false;
    if (minReleaseYear && (!t.release_date || parseInt(t.release_date, 10) < minReleaseYear)) return false;
    if (t.genres.some((g) => excluded.has(g.toLowerCase()))) return false;
    return true;
  });

  console.log(`[TMDB] Resolved ${matches.length}/${suggestions.length} titles in ${Date.now() - startTime}ms`);
  return kindFilter?.length === 1 ? matches : interleaveKinds(matches);
}

/**
 * The model tends to list all movies, then all series. Spread each kind evenly through the list,
 * keeping the model's ranking within each kind.
 */
function interleaveKinds(results) {
  const position = new Map();
  for (const kind of ["movie", "tv"]) {
    const ofKind = results.filter((r) => r.kind === kind);
    ofKind.forEach((r, i) => position.set(r, (i + 0.5) / ofKind.length));
  }
  return [...results].sort((a, b) => position.get(a) - position.get(b));
}

function cacheKey(...parts) {
  return JSON.stringify(parts);
}

/**
 * Natural-language search: the LLM suggests titles, TMDB supplies the data.
 */
export async function searchTitles(query, filters) {
  const key = cacheKey("search", query.toLowerCase(), filters);
  const cached = cache.get(key);
  if (cached) return cached;

  const suggestions = await askModel(`Request: "${query}"`, filters);
  const results = await hydrate(suggestions, filters);

  const result = { query, model: config.openaiModel, results, count: results.length, totalCount: results.length };
  cache.set(key, result);
  return result;
}

/**
 * "More like this": the LLM suggests titles similar to a TMDB title.
 */
export async function findSimilarTitles(titleId, kind, filters) {
  const key = cacheKey("similar", kind, titleId, filters);
  const cached = cache.get(key);
  if (cached) return cached;

  const source = await getTitleDetails(titleId, kind);
  const year = source.release_date?.slice(0, 4) || "unknown year";
  const request = [
    `Request: "${kind === "tv" ? "Shows" : "Movies"} like ${source.title} (${year})"`,
    `About ${source.title}: ${kind === "tv" ? "TV series" : "movie"}; genres: ${source.genres.join(", ") || "n/a"}; ${kind === "tv" ? "created by" : "directed by"} ${source.director || "n/a"}.`,
    `Overview: ${source.overview || "n/a"}`,
  ].join("\n");

  const suggestions = await askModel(request, filters);
  const results = await hydrate(suggestions, filters, `${kind}:${titleId}`);

  const result = {
    sourceId: titleId,
    sourceTitle: source.title,
    model: config.openaiModel,
    results,
    count: results.length,
  };
  cache.set(key, result);
  return result;
}
