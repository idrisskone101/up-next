import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = path.join(__dirname, ".searchable-progress.json");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Config - adjust if still timing out
const BATCH_SIZE = 100; // Small batches to avoid timeout
const DELAY_MS = 500; // Delay between batches
const MAX_RETRIES = 3;

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    }
  } catch (e) {}
  return { lastId: 0, updated: 0, skipped: 0 };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSearchable(title) {
  // Embeddings already filtered in query, just check language/content rules
  const languages = title.languages || [];
  const countries = title.production_countries || [];
  const genres = title.genres || [];

  const hasEnglish =
    languages.some((l) => l.toLowerCase() === "en" || l.toLowerCase() === "english");

  const hasEnglishCountry = countries.some((c) =>
    ["US", "GB", "CA", "AU", "NZ", "IE"].includes(c)
  );

  const isJapaneseAnime =
    languages.some((l) => l.toLowerCase() === "ja" || l.toLowerCase() === "japanese") &&
    genres.some((g) => g.toLowerCase() === "animation");

  const isReality = genres.some((g) => g.toLowerCase() === "reality");
  const hasPoster = title.poster_path && title.poster_path !== "";

  return hasPoster && (hasEnglish || hasEnglishCountry || isJapaneseAnime) && !isReality;
}

async function updateBatch(ids, value, retries = 0) {
  try {
    const { error } = await supabase
      .from("titles")
      .update({ is_searchable: value })
      .in("id", ids);

    if (error) throw error;
    return true;
  } catch (e) {
    if (retries < MAX_RETRIES) {
      console.log(`  Retry ${retries + 1}/${MAX_RETRIES}...`);
      await sleep(1000 * (retries + 1));
      return updateBatch(ids, value, retries + 1);
    }
    console.error(`  Failed after ${MAX_RETRIES} retries:`, e.message);
    return false;
  }
}

async function populateSearchable() {
  console.log("=== Populate is_searchable ===\n");
  console.log(`Config: BATCH_SIZE=${BATCH_SIZE}, DELAY=${DELAY_MS}ms`);
  console.log(`Only processing ~14k enriched titles (not all 64k)\n`);

  const progress = loadProgress();
  console.log(`Resuming from ID ${progress.lastId} (${progress.updated} updated, ${progress.skipped} skipped)\n`);

  let hasMore = true;

  while (hasMore) {
    // Fetch batch of ENRICHED titles only (have all 3 embeddings)
    const { data: batch, error } = await supabase
      .from("titles")
      .select("id, languages, production_countries, genres, poster_path")
      .gt("id", progress.lastId)
      .not("content_embedding", "is", null)
      .not("vibe_embedding", "is", null)
      .not("metadata_embedding", "is", null)
      .order("id", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      console.error("Fetch error:", error.message);
      await sleep(2000);
      continue;
    }

    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }

    // Separate into searchable and non-searchable
    const searchableIds = [];
    const nonSearchableIds = [];

    for (const title of batch) {
      if (isSearchable(title)) {
        searchableIds.push(title.id);
      } else {
        nonSearchableIds.push(title.id);
      }
    }

    // Update searchable titles
    if (searchableIds.length > 0) {
      const success = await updateBatch(searchableIds, true);
      if (success) progress.updated += searchableIds.length;
    }

    // Update non-searchable titles
    if (nonSearchableIds.length > 0) {
      await updateBatch(nonSearchableIds, false);
      progress.skipped += nonSearchableIds.length;
    }

    // Update progress
    progress.lastId = batch[batch.length - 1].id;
    saveProgress(progress);

    // Log progress
    const total = progress.updated + progress.skipped;
    process.stdout.write(
      `\rProcessed: ${total} | Searchable: ${progress.updated} | Last ID: ${progress.lastId}`
    );

    // Small delay to avoid rate limits
    await sleep(DELAY_MS);

    if (batch.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  console.log("\n\n✅ Phase 2 complete!");
  console.log(`   Total searchable: ${progress.updated}`);
  console.log(`   Total skipped: ${progress.skipped}`);

  // Cleanup progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }

  console.log("\n=== Next Steps ===");
  console.log("Run Phase 3 in Supabase Dashboard (SQL Editor):\n");
  console.log(`CREATE INDEX CONCURRENTLY titles_content_searchable_idx
ON titles USING hnsw (content_embedding vector_cosine_ops)
WITH (m = 24, ef_construction = 128)
WHERE is_searchable = TRUE;`);
}

populateSearchable().catch(console.error);
