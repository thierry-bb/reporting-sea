'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook pour fetcher des données Supabase côté client avec gestion loading/error.
 * @param {Function} queryFn - Fonction async retournant { data, error } de Supabase
 * @param {Array} deps - Dépendances déclenchant un refetch
 * @returns {{ data: any, loading: boolean, error: string|null, refetch: Function }}
 */
export function useSupabaseQuery(queryFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const execute = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: queryError } = await queryFn();
      if (cancelledRef.current) return;

      if (queryError) {
        setError(queryError.message);
        setData(null);
      } else {
        setData(result);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err.message || 'Erreur inconnue');
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
    return () => {
      cancelledRef.current = true;
    };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

export default useSupabaseQuery;
