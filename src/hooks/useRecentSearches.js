import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "recent-searches";
const MAX_SEARCHES = 10;

/**
 * Hook to manage recent search history
 * Stores in localStorage, max 10 items, most recent first
 * Dedupes on add (moves existing to top)
 */
export function useRecentSearches() {
  const [searches, setSearches] = useLocalStorage(STORAGE_KEY, []);

  const addSearch = useCallback((query) => {
    if (!query || typeof query !== "string") return;

    const trimmed = query.trim();
    if (!trimmed) return;

    setSearches((prev) => {
      // Remove if exists (for deduping)
      const filtered = prev.filter(
        (s) => s.query.toLowerCase() !== trimmed.toLowerCase()
      );
      // Add to front
      const updated = [
        { query: trimmed, timestamp: Date.now() },
        ...filtered
      ];
      // Cap at max
      return updated.slice(0, MAX_SEARCHES);
    });
  }, [setSearches]);

  const removeSearch = useCallback((query) => {
    setSearches((prev) =>
      prev.filter((s) => s.query !== query)
    );
  }, [setSearches]);

  const clearAll = useCallback(() => {
    setSearches([]);
  }, [setSearches]);

  return {
    searches,
    addSearch,
    removeSearch,
    clearAll
  };
}
