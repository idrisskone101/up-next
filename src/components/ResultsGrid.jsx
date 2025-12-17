import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { MovieCard } from "./MovieCard";
import { MovieModal } from "./MovieModal";
import { SearchMetadata } from "./SearchMetadata";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { getDiagonalDelay, enhancedGridItemVariants, springConfigs } from "../lib/animations";
import { haptics } from "../lib/haptics";
import { prefetchTrailers } from "../lib/trailerCache";
import { RefreshCw, ChevronDown } from "lucide-react";

// Pull-to-refresh constants
const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

/**
 * Hook to detect current grid column count based on viewport
 */
function useGridColumns() {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) setColumns(5);      // xl
      else if (width >= 1024) setColumns(4); // lg
      else if (width >= 768) setColumns(3);  // md
      else setColumns(2);                    // default
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return columns;
}

/**
 * Responsive grid container for movie cards with diagonal wave animations,
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
  totalCount,
}) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const columns = useGridColumns();

  // Preload first 6 visible results' backdrops for instant modal display
  useEffect(() => {
    results.slice(0, 6).forEach((movie) => {
      if (movie.backdrop_path) {
        const img = new Image();
        img.src = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
      }
    });
  }, [results]);

  // Prefetch trailers for first 10 results
  useEffect(() => {
    if (results.length > 0) {
      prefetchTrailers(results, 10);
    }
  }, [results]);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
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

    if (diff > 0 && window.scrollY <= 0) {
      const resistance = 1 - Math.min(diff / (MAX_PULL * 2), 0.5);
      const adjustedPull = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(adjustedPull);

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

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing && onRefresh) {
      onRefresh();
    }

    setPullDistance(0);
    setHasTriggered(false);
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const indicatorRotation = pullProgress * 180 + (isRefreshing ? 360 : 0);

  // Calculate remaining count for Load More button
  const remainingCount = totalCount ? totalCount - results.length : null;

  if (results.length === 0) {
    return null;
  }

  return (
    <LayoutGroup>
      <div
        ref={containerRef}
        className="space-y-8 relative pb-16"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator - Amber themed */}
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
                className={`flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md ${
                  hasTriggered || isRefreshing
                    ? "bg-amber-500/20 border border-amber-500/40"
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
                    hasTriggered || isRefreshing ? "text-amber-400" : "text-white/60"
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
          {/* <SearchMetadata metadata={searchMetadata} /> */}

          {/* Movie results grid */}
          <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8">
            <motion.div
              className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatePresence mode="popLayout">
                {results.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    layout
                    variants={enhancedGridItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{
                      ...springConfigs.snappy,
                      delay: getDiagonalDelay(index, columns, 0.03),
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

            {/* Load More button with remaining count */}
            {hasMore && (
              <motion.div
                className="mt-10 flex justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfigs.gentle, delay: 0.3 }}
              >
                <Button
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  size="lg"
                  className="group relative min-w-[220px] h-12 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-amber-500/30 text-white/80 hover:text-white transition-all duration-300"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <Spinner size={18} className="text-amber-400" />
                      <span className="text-sm">Loading...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                      <span className="text-sm font-medium">
                        {remainingCount !== null && remainingCount > 0
                          ? `Load ${Math.min(remainingCount, 20)} more${remainingCount > 20 ? ` of ${remainingCount}` : ""}`
                          : "Load More"}
                      </span>
                    </span>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Movie Detail Dialog */}
      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </LayoutGroup>
  );
}
