import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Flame, Brain, Skull, Popcorn, Moon, Clock } from "lucide-react";
import { DiscoveryRow } from "./DiscoveryRow";
import { DiscoveryCard } from "./DiscoveryCard";
import { MoodCard } from "./MoodCard";
import { QUERY_CATEGORIES, getRandomQueryFromCategory } from "../../lib/categories";

// Icon map for mood cards
const ICON_MAP = {
  Sparkles,
  Heart,
  Flame,
  Brain,
  Skull,
  Popcorn,
  Moon,
  Clock
};

// Skeleton card for loading state
function SkeletonDiscoveryCard() {
  return (
    <div className="w-[180px] flex-shrink-0">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] animate-shimmer" />
      </div>
      <div className="mt-2 space-y-2">
        <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
        <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

/**
 * Main discovery section container
 * Renders below hero with "For You" recommendations and mood browsing
 */
export function DiscoverySection({
  recommendations = [],
  loading = false,
  error = null,
  onCardClick,
  onMoodClick
}) {
  // Limit to 15 recommendations
  const displayRecommendations = recommendations.slice(0, 15);

  const handleMoodClick = (categoryId) => {
    const query = getRandomQueryFromCategory(categoryId);
    if (query) {
      onMoodClick?.(query);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="w-full max-w-[1200px] mx-auto px-6 py-12 space-y-12"
    >
      {/* For You Row */}
      <DiscoveryRow title="For You">
        <AnimatePresence mode="wait">
          {loading ? (
            // Loading skeletons
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-4"
            >
              {[...Array(8)].map((_, i) => (
                <SkeletonDiscoveryCard key={i} />
              ))}
            </motion.div>
          ) : error ? (
            // Error state
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center w-full py-8"
            >
              <p className="text-white/40 text-sm">Could not load recommendations</p>
            </motion.div>
          ) : displayRecommendations.length === 0 ? (
            // Empty state
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center w-full py-8"
            >
              <p className="text-white/40 text-sm">No recommendations available</p>
            </motion.div>
          ) : (
            // Recommendations - wrapped in single container for AnimatePresence
            <motion.div
              key="recommendations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-4"
            >
              {displayRecommendations.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                >
                  <DiscoveryCard
                    title={item.title}
                    poster_path={item.poster_path}
                    release_year={item.release_year}
                    tmdb_rating={item.tmdb_rating}
                    kind={item.kind}
                    onClick={() => onCardClick?.(item)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </DiscoveryRow>

      {/* Browse by Mood Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="space-y-4"
      >
        <motion.h2
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="text-xl font-heading font-semibold text-white/90 px-1"
        >
          Browse by Mood
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUERY_CATEGORIES.map((category, index) => {
            const Icon = ICON_MAP[category.icon];
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
              >
                <MoodCard
                  id={category.id}
                  label={category.label}
                  icon={Icon}
                  onClick={handleMoodClick}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
