import { useState, useEffect, useCallback } from 'react';
import { fetchRecommendations } from '../lib/api';

/**
 * Hook to fetch and manage recommended titles for homepage
 * @returns {Object} { recommendations, loading, error, refresh }
 */
export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRecommendations = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const data = await fetchRecommendations();
      setRecommendations(data.results || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load recommendations');
      setLoading(false);
      console.error('Error loading recommendations:', err);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const refresh = useCallback(() => {
    loadRecommendations(true);
  }, [loadRecommendations]);

  return { recommendations, loading, error, refresh };
}
