import { useState, useCallback, useMemo } from 'react';
import { searchMovies } from '../lib/api';

const PAGE_SIZE = 20;

/**
 * Custom hook for managing search state with local frontend pagination
 * All 300 candidates are fetched once and paginated locally
 */
export function useSearch() {
  const [allResults, setAllResults] = useState([]); // All 300 candidates
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [currentMatchCount, setCurrentMatchCount] = useState(80);
  const [currentMatchThreshold, setCurrentMatchThreshold] = useState(0);
  const [currentKindFilter, setCurrentKindFilter] = useState(null);
  const [currentMinReleaseYear, setCurrentMinReleaseYear] = useState(null);
  const [currentExcludeGenres, setCurrentExcludeGenres] = useState(null);

  // Compute paginated results from allResults
  const totalPages = useMemo(() => Math.ceil(allResults.length / PAGE_SIZE), [allResults.length]);
  const hasMore = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
  const results = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return allResults.slice(start, start + PAGE_SIZE);
  }, [allResults, currentPage]);

  const search = useCallback(async (query, matchCount = 80, matchThreshold = 0, kindFilter = null, minReleaseYear = null, excludeGenres = null) => {
    if (!query || query.trim().length === 0) {
      setAllResults([]);
      setSearchMetadata(null);
      setCurrentPage(1);
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
    setCurrentMinReleaseYear(minReleaseYear);
    setCurrentExcludeGenres(excludeGenres);

    try {
      // Fetch all candidates - backend returns them sorted by reranked_score
      const data = await searchMovies(query, matchCount, matchThreshold, kindFilter, minReleaseYear, excludeGenres);

      setAllResults(data.results || []);
      setSearchMetadata({
        query: data.query,
        weights: data.weights,
        weightReasoning: data.weightReasoning,
        count: data.count,
        totalCount: data.totalCount,
        metadata: data.metadata
      });
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while searching';
      const isTimeout = err.timeout || errorMessage.toLowerCase().includes('timeout');

      setError({
        message: errorMessage,
        timeout: isTimeout,
        originalError: err,
      });
      setAllResults([]);
      setSearchMetadata(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Navigate to a specific page (local pagination, no API call)
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  // Load next page (for compatibility with existing UI)
  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  const reset = useCallback(() => {
    setAllResults([]);
    setError(null);
    setSearchMetadata(null);
    setLoading(false);
    setRefreshing(false);
    setCurrentPage(1);
    setCurrentQuery(null);
  }, []);

  // Refresh current search results (for pull-to-refresh)
  const refresh = useCallback(async () => {
    if (!currentQuery || refreshing) return;

    setRefreshing(true);
    setError(null);
    setCurrentPage(1);

    try {
      // Fetch all candidates - backend returns them sorted by reranked_score
      const data = await searchMovies(currentQuery, currentMatchCount, currentMatchThreshold, currentKindFilter, currentMinReleaseYear, currentExcludeGenres);

      setAllResults(data.results || []);
      setSearchMetadata({
        query: data.query,
        weights: data.weights,
        weightReasoning: data.weightReasoning,
        count: data.count,
        totalCount: data.totalCount,
        metadata: data.metadata
      });
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while refreshing';
      const isTimeout = err.timeout || errorMessage.toLowerCase().includes('timeout');

      setError({
        message: errorMessage,
        timeout: isTimeout,
        originalError: err,
      });
    } finally {
      setRefreshing(false);
    }
  }, [currentQuery, currentMatchCount, currentMatchThreshold, currentKindFilter, currentMinReleaseYear, currentExcludeGenres, refreshing]);

  // Set results directly (for similar search)
  const setSimilarResults = useCallback((similarData, sourceTitle) => {
    setAllResults(similarData.results || []);
    setSearchMetadata({
      query: `Similar to "${sourceTitle}"`,
      weights: similarData.weights,
      count: similarData.count,
      totalCount: similarData.count,
      isSimilarSearch: true,
      sourceId: similarData.sourceId,
      sourceTitle: similarData.sourceTitle,
    });
    setCurrentPage(1);
    setLoading(false);
  }, []);

  // Start loading state for similar search
  const startSimilarLoading = useCallback(() => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
  }, []);

  // Set error for similar search
  const setSimilarError = useCallback((err) => {
    setError({
      message: err.message || 'An error occurred',
      timeout: false,
    });
    setAllResults([]);
    setSearchMetadata(null);
    setLoading(false);
  }, []);

  return {
    results,
    allResults,
    loading,
    refreshing,
    error,
    searchMetadata,
    hasMore,
    currentPage,
    totalPages,
    pageSize: PAGE_SIZE,
    search,
    loadMore,
    goToPage,
    refresh,
    reset,
    setSimilarResults,
    startSimilarLoading,
    setSimilarError,
  };
}
