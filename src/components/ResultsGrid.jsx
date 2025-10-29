import { useState } from "react";
import { MovieCard } from "./MovieCard";
import { MovieModal } from "./MovieModal";
import { SearchMetadata } from "./SearchMetadata";

/**
 * Responsive grid container for movie cards
 */
export function ResultsGrid({ results, searchMetadata }) {
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
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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
