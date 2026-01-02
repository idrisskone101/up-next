import { useState, useEffect, useRef } from "react";
import { searchTitles } from "../lib/api";

const DEBOUNCE_MS = 150;

/**
 * Debounced title search hook for @mention feature
 * Cancels previous requests on new query
 */
export function useTitleSearch(searchText) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset if empty
    if (!searchText || searchText.length < 1) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    // Debounce
    timeoutRef.current = setTimeout(async () => {
      // Abort previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      try {
        const data = await searchTitles(searchText, 6, abortRef.current.signal);
        setResults(data.results || []);
        setError(null);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [searchText]);

  return { results, loading, error };
}
