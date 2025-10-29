import { useState, useCallback } from 'react';
import { searchMovies } from '../lib/api';

/**
 * Custom hook for managing search state and API calls
 */
export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMetadata, setSearchMetadata] = useState(null);

  const search = useCallback(async (query, matchCount = 20, matchThreshold = 0.3) => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      setSearchMetadata(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchMovies(query, matchCount, matchThreshold);

      setResults(data.results || []);
      setSearchMetadata({
        query: data.query,
        weights: data.weights,
        weightReasoning: data.weightReasoning,
        count: data.count,
        metadata: data.metadata
      });
    } catch (err) {
      setError(err.message || 'An error occurred while searching');
      setResults([]);
      setSearchMetadata(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setSearchMetadata(null);
    setLoading(false);
  }, []);

  return {
    results,
    loading,
    error,
    searchMetadata,
    search,
    reset,
  };
}
