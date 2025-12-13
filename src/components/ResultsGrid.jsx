import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { MovieCard } from "./MovieCard";
import { MovieModal } from "./MovieModal";
import { SearchMetadata } from "./SearchMetadata";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { gridContainerVariants, springConfigs } from "../lib/animations";

/**
 * Responsive grid container for movie cards with staggered animations and shared element support
 */
export function ResultsGrid({
  results,
  searchMetadata,
  hasMore,
  loadingMore,
  onLoadMore,
}) {
  const [selectedMovie, setSelectedMovie] = useState(null);

  if (results.length === 0) {
    return null;
  }

  return (
    <LayoutGroup>
      <div className="space-y-8">
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
