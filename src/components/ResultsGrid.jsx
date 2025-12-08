import { useState } from "react";
import { MovieCard } from "./MovieCard";
import { MovieModal } from "./MovieModal";
import { SearchMetadata } from "./SearchMetadata";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

/**
 * Responsive grid container for movie cards with pagination support
 */
export function ResultsGrid({ results, searchMetadata, hasMore, loadingMore, onLoadMore }) {
  const [selectedMovie, setSelectedMovie] = useState(null);

  if (results.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-8">
        {/* Search metadata */}
        <SearchMetadata metadata={searchMetadata} />

        {/* Movie results grid */}
        <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((movie, index) => (
              <div
                key={movie.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-slide-up"
              >
                <MovieCard
                  movie={movie}
                  onClick={() => setSelectedMovie(movie)}
                />
              </div>
            ))}
          </div>

          {/* Load More button */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
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
            </div>
          )}
        </div>
      </div>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </>
  );
}
