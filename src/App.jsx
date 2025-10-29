import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { ShimmeringText } from "./components/ui/ShimmeringText";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Navbar } from "./components/Navbar";
import { SearchBar } from "./components/SearchBar";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { SkeletonCard } from "./components/SkeletonCard";
import { EmptyState } from "./components/EmptyState";
import { ResultsGrid } from "./components/ResultsGrid";
import { MovieModal } from "./components/MovieModal";
import { useSearch } from "./hooks/useSearch";
import { useRecommendations } from "./hooks/useRecommendations";

function App() {
  const { results, loading, error, searchMetadata, search, reset } = useSearch();
  const { recommendations, loading: loadingRecs, error: recsError } = useRecommendations();
  const [selectedMovie, setSelectedMovie] = useState(null);

  const hasResults = results.length > 0;
  const showIntro = !loading && !hasResults && !error && !searchMetadata;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">

      <div className="relative flex min-h-dvh flex-col">
        <Navbar />

        {/* Hero Section */}
        <header className="container w-full space-y-6 pb-10 pt-safe pt-8 md:space-y-8 md:pb-12 md:pt-12">
          <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
            <div className="space-y-3">
              <h1 className="text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Discover your next favorite movie.
              </h1>
              <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground/80">
                Search by vibe, genre, theme, or mood — powered by semantic AI.
              </p>
            </div>
          </div>

          <SearchBar onSearch={search} loading={loading} />
        </header>

        {/* Main Content */}
        <main className="container flex w-full flex-1 flex-col gap-10 pb-16 pt-4 md:gap-12 md:pb-20">
          {loading && (
            <div className="space-y-8">
              {/* Skeleton loaders while searching */}
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && !loading && (
            <Card className="mx-auto flex w-full max-w-2xl animate-scale-in flex-col items-center text-center border-destructive/40 bg-destructive/15">
              <CardHeader className="items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/30">
                  <AlertCircle className="h-6 w-6 text-destructive-foreground" />
                </div>
                <CardTitle className="text-xl">We lost the signal</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {error}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex w-full items-center justify-center">
                <Button onClick={reset} size="lg" variant="accent">
                  Try again
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && searchMetadata && results.length === 0 && !error && (
            <EmptyState type="no-results" query={searchMetadata.query} />
          )}

          {hasResults && !loading && (
            <ResultsGrid results={results} searchMetadata={searchMetadata} />
          )}

          {/* Recommended For You Section */}
          {showIntro && !loadingRecs && recommendations.length > 0 && (
            <section className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-semibold tracking-tight">Recommended For You</h2>
              <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {recommendations.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => setSelectedMovie(movie)}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/85 text-left shadow-soft transition sm:hover:-translate-y-1 sm:hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {/* Movie poster */}
                    <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-primary/10 via-background/40 to-accent/10">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          className="h-full w-full object-cover transition-transform duration-500 sm:group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                          <svg
                            className="h-16 w-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity duration-500 sm:group-hover:opacity-100" />
                    </div>

                    {/* Movie info */}
                    <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-4">
                      <h3 className="text-base font-semibold text-foreground line-clamp-2">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                        </span>
                        {movie.vote_average && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="h-3 w-3 text-amber-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {movie.vote_average.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {showIntro && loadingRecs && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner message="Loading recommendations…" />
            </div>
          )}

          {showIntro && recsError && !loadingRecs && (
            <Card className="mx-auto w-full max-w-2xl text-center">
              <CardHeader>
                <CardTitle className="text-xl">Failed to load recommendations</CardTitle>
                <CardDescription>{recsError}</CardDescription>
              </CardHeader>
            </Card>
          )}
        </main>

        {/* Footer */}
        <footer className="pb-safe pb-12 pt-8">
          <div className="container flex flex-col items-center gap-3 text-center text-xs text-muted-foreground/80 sm:text-sm">
            <p>
              Powered by multi-embedding semantic search with adaptive signal weighting.
            </p>
            <p>© {new Date().getFullYear()} upNext. Curated with curiosity.</p>
          </div>
        </footer>
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}

export default App;
