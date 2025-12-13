import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform } from "framer-motion";
import { MovieCard } from "./MovieCard";
import { MovieModal } from "./MovieModal";
import { SearchMetadata } from "./SearchMetadata";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { gridContainerVariants, springConfigs } from "../lib/animations";
import { haptics } from "../lib/haptics";
import { RefreshCw } from "lucide-react";

// Pull-to-refresh constants
const PULL_THRESHOLD = 80; // px needed to trigger refresh
const MAX_PULL = 120;      // max pull distance

/**
 * Responsive grid container for movie cards with staggered animations,
 * pull-to-refresh, and shared element support
 */
export function ResultsGrid({
  results,
  searchMetadata,
  hasMore,
  loadingMore,
  onLoadMore,
  onRefresh,
  isRefreshing = false,
}) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    // Only enable pull-to-refresh when at top of scroll
    if (containerRef.current && window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      setHasTriggered(false);
    }
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // Only pull down, not up
    if (diff > 0 && window.scrollY <= 0) {
      // Apply resistance as pull increases
      const resistance = 1 - Math.min(diff / (MAX_PULL * 2), 0.5);
      const adjustedPull = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(adjustedPull);

      // Trigger haptic when crossing threshold
      if (adjustedPull >= PULL_THRESHOLD && !hasTriggered) {
        setHasTriggered(true);
        haptics.success();
      }
    }
  }, [isPulling, isRefreshing, hasTriggered]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;

    setIsPulling(false);

    // If pulled past threshold and not already refreshing, trigger refresh
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing && onRefresh) {
      onRefresh();
    }

    // Reset pull distance
    setPullDistance(0);
    setHasTriggered(false);
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  // Calculate pull progress (0-1)
  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const indicatorRotation = pullProgress * 180 + (isRefreshing ? 360 : 0);

  if (results.length === 0) {
    return null;
  }

  return (
    <LayoutGroup>
      <div
        ref={containerRef}
        className="space-y-8 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {(pullDistance > 0 || isRefreshing) && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
              initial={{ opacity: 0, y: -40 }}
              animate={{
                opacity: 1,
                y: isRefreshing ? 16 : Math.min(pullDistance - 40, 20),
              }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  hasTriggered || isRefreshing
                    ? "bg-cyan-500/20 border border-cyan-500/40"
                    : "bg-white/10 border border-white/20"
                }`}
                animate={{
                  rotate: isRefreshing ? 360 : indicatorRotation,
                  scale: hasTriggered ? 1.1 : 1,
                }}
                transition={{
                  rotate: isRefreshing
                    ? { duration: 1, repeat: Infinity, ease: "linear" }
                    : { type: "spring", stiffness: 200 },
                  scale: { type: "spring", stiffness: 400 },
                }}
              >
                <RefreshCw
                  className={`w-5 h-5 ${
                    hasTriggered || isRefreshing ? "text-cyan-400" : "text-white/60"
                  }`}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content offset when pulling */}
        <motion.div
          animate={{
            y: isRefreshing ? 60 : pullDistance > 0 ? pullDistance * 0.5 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Search metadata */}
          <SearchMetadata metadata={searchMetadata} />

        {/* Movie results grid */}
        <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <AnimatePresence mode="popLayout">
              {results.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.97,
                    transition: { duration: 0.15 },
                  }}
                  transition={{
                    ...springConfigs.bouncy,
                    delay: index * 0.02,
                  }}
                >
                  <MovieCard
                    movie={movie}
                    index={index}
                    onClick={() => setSelectedMovie(movie)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Load More button */}
          {hasMore && (
            <motion.div
              className="mt-8 flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springConfigs.gentle, delay: 0.2 }}
            >
              <Button
                onClick={onLoadMore}
                disabled={loadingMore}
                size="lg"
                variant="accent"
                className="min-w-[200px]"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <Spinner size={20} className="text-current" />
                    Loading...
                  </span>
                ) : (
                  "Load More"
                )}
              </Button>
            </motion.div>
          )}
        </div>
        </motion.div>
      </div>

      {/* Movie Modal with AnimatePresence for exit animations */}
      <AnimatePresence mode="wait">
        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
