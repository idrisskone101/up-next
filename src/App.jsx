import { useState } from "react";
import { AlertCircle, CloudCog } from "lucide-react";
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
import { Spinner } from "./components/ui/spinner";
import { SkeletonCard } from "./components/SkeletonCard";
import { EmptyState } from "./components/EmptyState";
import { ResultsGrid } from "./components/ResultsGrid";
import { MovieModal } from "./components/MovieModal";
import { useSearch } from "./hooks/useSearch";
import { useRecommendations } from "./hooks/useRecommendations";

function App() {
  const { results, loading, loadingMore, error, searchMetadata, hasMore, search, loadMore, reset } = useSearch();
  const { recommendations, loading: loadingRecs, error: recsError } = useRecommendations();
  const [selectedMovie, setSelectedMovie] = useState(null);

  const hasResults = results.length > 0;
  const showIntro = !loading && !hasResults && !error && !searchMetadata;

  console.log("results", results);

   

  return (
    <div className="relative min-h-dvh overflow-x-hidden">

      <div className="relative flex min-h-dvh flex-col">
        <Navbar />

        {/* Hero Section */}
        <header className="relative container w-full space-y-8 pb-12 pt-safe pt-16 md:space-y-12 md:pb-20 md:pt-24">
          <div className="absolute inset-0 -z-10 mx-auto h-full w-full max-w-5xl opacity-30 blur-3xl">
            <div className="aspect-[1100/400] w-full bg-gradient-to-r from-primary via-accent to-primary animate-pulse" style={{ clipPath: 'ellipse(50% 50% at 50% 50%)' }} />
          </div>
          
          <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
            <div className="space-y-4 max-w-4xl">
              <h1 className="text-glow text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
                Find films that fit your mood, not just your menu.
              </h1>
              <p className="mx-auto max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Describe a vibe, a feeling, or just type <span className="text-primary font-medium italic">anything</span>—and let smart search match you with movies & shows you'll love.
              </p>
            </div>
          </div>

          <SearchBar onSearch={(query, kindFilter) => search(query, 100, 0.4, kindFilter)} loading={loading} />
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
                <CardTitle className="text-xl">
                  {typeof error === 'object' && error.timeout 
                    ? 'Search timed out' 
                    : 'We lost the signal'}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {typeof error === 'object' ? error.message : error}
                </CardDescription>
                {typeof error === 'object' && error.timeout && (
                  <CardDescription className="text-xs text-muted-foreground/70 mt-2">
                    The search is taking longer than expected. This might be due to high server load. 
                    Try searching again in a moment, or use a simpler query.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex w-full items-center justify-center gap-3">
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
            <ResultsGrid 
              results={results} 
              searchMetadata={searchMetadata}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          )}

          {/* Recommended For You Section */}
          {showIntro && !loadingRecs && recommendations.length > 0 && (
            <section className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-semibold tracking-tight">Recommended For You</h2>
              <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {recommendations.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => setSelectedMovie(movie)}
                    className="group relative flex w-full flex-col gap-2 text-left transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {/* Movie poster */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted/20 shadow-md transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-primary/10">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 bg-muted/20">
                           {/* Simple fallback icon */}
                           <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    {/* Movie info */}
                    <div className="space-y-1 px-0.5">
                      <h3 className="text-sm font-medium leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                        <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}</span>
                        {movie.vote_average && (
                          <span className="flex items-center gap-1 text-amber-400/90">
                            ★ {movie.vote_average.toFixed(1)}
                          </span>
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
              <Spinner size={70} className="text-primary" ariaLabel="Loading…" message="Loading recommendations…" />
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
