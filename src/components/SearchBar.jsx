import { useState, useEffect, useRef } from "react";
import { Search, Mic, MoreHorizontal, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

/**
 * Responsive search bar inspired by shadcn/ui surface treatments.
 * Optimized for thumb reach and minimal taps on mobile.
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
              className="h-14 w-full rounded-[28px] border-none bg-muted/40 px-12 pr-12 text-base text-foreground placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {loading ? (
              <Loader2 className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary animate-spin" />
            ) : (
              <Mic className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
            )}
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-full bg-muted/40 px-4 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            Add specific filters
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
