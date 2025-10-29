import { useState, useEffect } from 'react';
import { fetchRecommendations } from '../lib/api';

/**
 * Hook to fetch and manage recommended titles for homepage
 * @returns {Object} { recommendations, loading, error }
 */
export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchRecommendations();

        if (isMounted) {
          setRecommendations(data.results || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load recommendations');
          setLoading(false);
          console.error('Error loading recommendations:', err);
        }
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  return { recommendations, loading, error };
}
