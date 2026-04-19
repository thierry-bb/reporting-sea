'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './NavigationProgress.module.css';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    function handleStart() {
      clearTimeout(timerRef.current);
      setActive(true);
    }
    window.addEventListener('nav:start', handleStart);
    return () => window.removeEventListener('nav:start', handleStart);
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => setActive(false), 300);
    return () => clearTimeout(timerRef.current);
  }, [pathname, searchParams]);

  if (!active) return null;
  return <div className={styles.bar} />;
}
