'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { normalizeMonth, getPreviousMonth } from '@/lib/formatters';

/**
 * Hook pour gérer le filtre de mois via URL search params.
 * @returns {{ selectedMonth: string, setMonth: Function }}
 */
export function useDateRange() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawMonth = searchParams.get('month');
  const selectedMonth = normalizeMonth(rawMonth) || getPreviousMonth();

  const setMonth = useCallback((monthValue) => {
    const params = new URLSearchParams(searchParams.toString());
    // Accepte "2024-03" ou "2024-03-01", stocke toujours "2024-03" dans l'URL
    const short = monthValue.slice(0, 7);
    params.set('month', short);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return { selectedMonth, setMonth };
}

export default useDateRange;
