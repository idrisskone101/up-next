import { useState, useEffect, useRef } from "react";
import { Search, Mic, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

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

  return (
    <div className="mx-auto w-full max-w-3xl px-2 sm:px-0">
      <div className="space-y-3">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for movies or genres..."
              disabled={loading}
              className="h-14 w-full rounded-[28px] border-none bg-muted/40 pl-14 pr-12 text-base text-foreground placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 select-text"
            />
            {loading ? (
              <Spinner size={20} className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" ariaLabel="Loading…" />
            ) : (
              <div className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center">
                {query ? (
                  <button
                    key="clear-button"
                    type="button"
                    onClick={handleClear}
                    className="flex items-center justify-center rounded-full p-1 text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground transition-all duration-200 animate-scale-in w-full h-full"
                    aria-label="Clear search"
                  >
                    <X className="w-8 h-8" />
                  </button>
                ) : (
                  <Mic
                    key="mic-icon"
                    className="flex items-center justify-center pointer-events-none text-muted-foreground/60 animate-scale-in w-5 h-5"
                  />
                )}
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleToggleMovies}
            className={`h-10 rounded-full px-4 text-sm transition-all duration-200 ${
              moviesEnabled
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            Movies
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleToggleTV}
            className={`h-10 rounded-full px-4 text-sm transition-all duration-200 ${
              tvEnabled
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            TV Shows
          </Button>
        </div>
      </div>
    </div>
  );
}
