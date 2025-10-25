import { useState, useEffect, useRef } from "react";

/**
 * Large, centered search input component with auto-focus - optimized for mobile touch
 */
export function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  // Auto-focus on mount (only on desktop)
  useEffect(() => {
    // Don't auto-focus on mobile to prevent keyboard popping up
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      inputRef.current?.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Blur input on mobile to dismiss keyboard
      inputRef.current?.blur();
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 animate-slide-up">
      <form onSubmit={handleSubmit} className="relative">
        {/* Search icon */}
        <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 md:w-6 md:h-6 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input field - optimized touch target */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies and TV shows..."
          disabled={loading}
          className="w-full pl-12 md:pl-16 pr-24 md:pr-32 py-4 md:py-5 text-base md:text-lg text-white placeholder-white/40
                     glass rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                     focus:border-cyan-400/50 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     min-h-[56px] md:min-h-[auto]"
        />

        {/* Clear button - larger touch target */}
        {query && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 md:right-28 top-1/2 -translate-y-1/2 p-2 md:p-2 text-white/50
                     hover:text-white/80 transition-colors active:scale-90
                     min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Submit button - optimized for touch */}
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 px-4 md:px-6 py-2.5 md:py-2.5
                     bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium
                     rounded-xl hover:from-cyan-600 hover:to-blue-600
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-200 md:hover:scale-105 active:scale-95
                     min-h-[44px] text-sm md:text-base"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="hidden md:inline">Searching</span>
            </div>
          ) : (
            "Search"
          )}
        </button>
      </form>
    </div>
  );
}
