import { useState } from "react";
import { Badge } from "./ui/badge";
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

  const weights = searchMetadata?.weights;

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {searchMetadata && (
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-background/75 p-6 shadow-soft backdrop-blur-xl sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-70" />
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-6 text-sm text-muted-foreground">
              <div className="flex flex-col gap-2 text-foreground">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                  Semantic pulse
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-semibold">
                    {searchMetadata.count}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground/60">
                    matches
                  </span>
                </div>
              </div>

              {weights && (
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                    Signal mix
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary" className="font-mono">
                      Content · {(weights.content * 100).toFixed(0)}%
                    </Badge>
                    <Badge variant="accent" className="font-mono">
                      Vibe · {(weights.vibe * 100).toFixed(0)}%
                    </Badge>
                    <Badge className="font-mono">
                      Metadata · {(weights.metadata * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              )}

              {searchMetadata.weightReasoning && (
                <p className="max-w-xl flex-1 text-xs italic text-muted-foreground/80 sm:text-sm">
                  {searchMetadata.weightReasoning}
                </p>
              )}

              {searchMetadata.metadata?.duration_ms && (
                <span className="text-xs uppercase tracking-wide text-muted-foreground/60">
                  {searchMetadata.metadata.duration_ms}ms
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </>
  );
}
