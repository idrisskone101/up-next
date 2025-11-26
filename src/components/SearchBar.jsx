import { useState, useEffect, useRef } from "react";
import { Search, Mic, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

const EXAMPLE_QUERIES = [
  "Movies that make you ugly cry",
  "Cozy rainy day vibes",
  "Mind-bending plot twists",
  "90s nostalgia trip",
  "Feel-good underdog stories",
  "Existential crisis at 2am",
  "Heist movies but make it funny",
  "Visually stunning cinematography",
  "Enemies to lovers slow burn",
  "Found family trope",
  "Comfort movies for a bad day",
  "Chaotic unhinged energy",
  "Movies where the villain wins",
  "Atmospheric and creepy",
  "Badass female leads",
  "Summer road trip vibes",
];

/**
 * Responsive search bar inspired by shadcn/ui surface treatments.
 * Optimized for thumb reach and minimal taps on mobile.
 */
export function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const [moviesEnabled, setMoviesEnabled] = useState(false);
  const [tvEnabled, setTvEnabled] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      inputRef.current?.focus();
    }
  }, []);

  // Calculate kindFilter based on toggle states
  const getKindFilter = () => {
    if (moviesEnabled && !tvEnabled) {
      return ['movie'];
    } else if (tvEnabled && !moviesEnabled) {
      return ['tv'];
    }
    // Both on or both off means search both
    return null;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (query.trim()) {
      inputRef.current?.blur();
      onSearch(query.trim(), getKindFilter());
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleToggleMovies = () => {
    const newMoviesEnabled = !moviesEnabled;
    setMoviesEnabled(newMoviesEnabled);
    // Trigger search if query exists
    if (query.trim()) {
      // Calculate filter with new state
      let newFilter = null;
      if (newMoviesEnabled && !tvEnabled) {
        newFilter = ['movie'];
      } else if (!newMoviesEnabled && tvEnabled) {
        newFilter = ['tv'];
      }
      // Otherwise newFilter stays null (search both)
      onSearch(query.trim(), newFilter);
    }
  };

  const handleToggleTV = () => {
    const newTvEnabled = !tvEnabled;
    setTvEnabled(newTvEnabled);
    // Trigger search if query exists
    if (query.trim()) {
      // Calculate filter with new state
      let newFilter = null;
      if (!moviesEnabled && newTvEnabled) {
        newFilter = ['tv'];
      } else if (moviesEnabled && !newTvEnabled) {
        newFilter = ['movie'];
      }
      // Otherwise newFilter stays null (search both)
      onSearch(query.trim(), newFilter);
    }
  };

  const handleExampleClick = (exampleQuery) => {
    setQuery(exampleQuery);
    onSearch(exampleQuery, getKindFilter());
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-2 sm:px-0">
      <div className="space-y-3">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for movies or genres..."
              disabled={loading}
              className="h-16 w-full rounded-full border border-white/10 bg-white/5 pl-14 pr-14 text-lg text-foreground placeholder:text-muted-foreground/50 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/20 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 focus-visible:bg-white/10"
            />
            {loading ? (
              <Spinner size={24} className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-primary" ariaLabel="Loading…" />
            ) : (
              <div className="absolute right-5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center">
                {query ? (
                  <button
                    key="clear-button"
                    type="button"
                    onClick={handleClear}
                    className="flex items-center justify-center rounded-full p-1 text-muted-foreground/60 hover:bg-white/10 hover:text-foreground transition-all duration-200 animate-scale-in w-full h-full"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <Mic
                    key="mic-icon"
                    className="flex items-center justify-center pointer-events-none text-muted-foreground/40 animate-scale-in w-6 h-6"
                  />
                )}
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleToggleMovies}
            className={`h-9 rounded-full border px-4 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
              moviesEnabled
                ? 'border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground hover:border-white/20'
            }`}
          >
            Movies
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleToggleTV}
            className={`h-9 rounded-full border px-4 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
              tvEnabled
                ? 'border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground hover:border-white/20'
            }`}
          >
            TV Shows
          </Button>
        </div>

        {/* Example Queries */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground/60 mr-1">Try:</span>
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-muted-foreground/80 hover:bg-white/10 hover:text-foreground hover:border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
