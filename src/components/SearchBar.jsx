import { useState, useEffect, useRef } from "react";
import { Loader2, Search, X, Mic } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

/**
 * Responsive search bar inspired by shadcn/ui surface treatments.
 * Optimised for thumb reach and minimal taps on mobile.
 */
export function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      inputRef.current?.focus();
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (query.trim()) {
      inputRef.current?.blur();
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleVoiceSearch = (event) => {
    event.preventDefault();
    // Placeholder for future voice search functionality
    console.log("Voice search clicked");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-2 sm:px-0">
      <form
        onSubmit={handleSubmit}
        className="relative animate-slide-up overflow-hidden rounded-[28px] border border-border/40 bg-background/75 p-2 shadow-soft backdrop-blur-2xl sm:rounded-[34px] sm:p-2.5"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-80" />
        <div className="relative z-10 flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/70 sm:block" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies..."
              disabled={loading}
              className="h-12 w-full rounded-2xl border-none bg-transparent px-4 pr-12 text-base font-medium text-foreground placeholder:text-muted-foreground/70 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-14 sm:rounded-3xl sm:pl-12 sm:pr-14 sm:text-lg"
            />
            {query && !loading && (
              <Button
                type="button"
                onClick={handleClear}
                variant="ghost"
                size="icon"
                className="absolute right-12 top-1/2 h-10 w-10 -translate-y-1/2 rounded-2xl text-muted-foreground transition hover:text-foreground sm:right-14"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {!loading && (
              <Button
                type="button"
                onClick={handleVoiceSearch}
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-2xl text-muted-foreground transition hover:text-foreground sm:right-3"
                aria-label="Voice search"
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Button
            type="submit"
            disabled={!query.trim() || loading}
            size="lg"
            className="h-12 rounded-2xl px-5 text-sm sm:h-14 sm:rounded-3xl sm:px-7 sm:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Searching</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 sm:hidden" />
                <span>Search</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
