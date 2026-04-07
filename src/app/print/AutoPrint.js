'use client';

import { useEffect } from 'react';

export default function AutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Force Recharts ResponsiveContainer to remeasure before print
      window.dispatchEvent(new Event('resize'));
      setTimeout(() => window.print(), 300);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
