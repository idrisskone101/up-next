import { useState, useCallback } from 'react';
import { searchMovies } from '../lib/api';

/**
 * Custom hook for managing search state and API calls with pagination support
 */
export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [currentMatchCount, setCurrentMatchCount] = useState(100);
  const [currentMatchThreshold, setCurrentMatchThreshold] = useState(0.4);
  const [currentKindFilter, setCurrentKindFilter] = useState(null);
  const pageSize = 20;

  const search = useCallback(async (query, matchCount = 100, matchThreshold = 0.4, kindFilter = null) => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      setSearchMetadata(null);
      setCurrentPage(1);
      setHasMore(false);
      setCurrentQuery(null);
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setCurrentQuery(query);
    setCurrentMatchCount(matchCount);
    setCurrentMatchThreshold(matchThreshold);
    setCurrentKindFilter(kindFilter);

    try {
      const data = await searchMovies(query, matchCount, matchThreshold, kindFilter, 1, pageSize);

      setResults(data.results || []);
      setHasMore(data.hasMore || false);
      setSearchMetadata({
        query: data.query,
        weights: data.weights,
        weightReasoning: data.weightReasoning,
        count: data.count,
        totalCount: data.totalCount,
        page: data.page,
        totalPages: data.totalPages,
        hasMore: data.hasMore,
        metadata: data.metadata
      });
    } catch (err) {
      // Preserve timeout flag for better error handling
      const errorMessage = err.message || 'An error occurred while searching';
      const isTimeout = err.timeout || errorMessage.toLowerCase().includes('timeout');
      
      setError({
        message: errorMessage,
        timeout: isTimeout,
        originalError: err,
      });
      setResults([]);
      setSearchMetadata(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!currentQuery || loadingMore || !hasMore) return;

    const nextPage = currentPage + 1;
    setLoadingMore(true);
    setError(null);

    try {
      const data = await searchMovies(
        currentQuery, 
        currentMatchCount, 
        currentMatchThreshold, 
        currentKindFilter, 
        nextPage, 
        pageSize
      );

      setResults(prev => [...prev, ...(data.results || [])]);
      setHasMore(data.hasMore || false);
      setCurrentPage(nextPage);
      setSearchMetadata(prev => ({
        ...prev,
        count: prev.count + (data.count || 0),
        page: data.page,
        hasMore: data.hasMore,
      }));
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while loading more results';
      const isTimeout = err.timeout || errorMessage.toLowerCase().includes('timeout');
      
      setError({
        message: errorMessage,
        timeout: isTimeout,
        originalError: err,
      });
    } finally {
      setLoadingMore(false);
    }
  }, [currentQuery, currentMatchCount, currentMatchThreshold, currentKindFilter, currentPage, hasMore, loadingMore]);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setSearchMetadata(null);
    setLoading(false);
    setLoadingMore(false);
    setCurrentPage(1);
    setHasMore(false);
    setCurrentQuery(null);
  }, []);

  return {
    results,
    loading,
    loadingMore,
    error,
    searchMetadata,
    hasMore,
    search,
    loadMore,
    reset,
  };
}
