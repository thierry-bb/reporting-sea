'use client';

import { useSearchParams } from 'next/navigation';
import styles from './PrintButton.module.css';

export default function PrintButton() {
  const searchParams = useSearchParams();
  const client = searchParams.get('client') || '';
  const month = searchParams.get('month') || '';

  const printUrl = `/print?client=${client}&month=${month}`;

  return (
    <a
      href={printUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.btn}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Exporter PDF
    </a>
  );
}
