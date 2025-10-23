import { useState } from "react";
import { MovieCard } from "./MovieCard";
import { MovieModal } from "./MovieModal";

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
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* Search metadata */}
        {searchMetadata && (
          <div className="mb-6 glass rounded-xl p-4 animate-fade-in">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-white/60">Results: </span>
                <span className="text-white font-semibold">
                  {searchMetadata.count}
                </span>
              </div>

              {searchMetadata.weights && (
                <>
                  <div className="hidden md:block h-4 w-px bg-white/20" />
                  <div className="flex items-center gap-3">
                    <span className="text-white/60">Weights:</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-400/20 text-blue-200 rounded text-xs font-mono">
                        C: {(searchMetadata.weights.content * 100).toFixed(0)}%
                      </span>
                      <span className="px-2 py-1 bg-cyan-400/20 text-cyan-200 rounded text-xs font-mono">
                        V: {(searchMetadata.weights.vibe * 100).toFixed(0)}%
                      </span>
                      <span className="px-2 py-1 bg-blue-400/20 text-blue-200 rounded text-xs font-mono">
                        M: {(searchMetadata.weights.metadata * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </>
              )}

              {searchMetadata.weightReasoning && (
                <>
                  <div className="hidden lg:block h-4 w-px bg-white/20" />
                  <div className="text-white/70 italic text-xs max-w-md">
                    {searchMetadata.weightReasoning}
                  </div>
                </>
              )}

              {searchMetadata.metadata?.duration_ms && (
                <>
                  <div className="hidden md:block h-4 w-px bg-white/20" />
                  <div className="text-white/60 text-xs">
                    {searchMetadata.metadata.duration_ms}ms
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

      {/* Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </>
  );
}
