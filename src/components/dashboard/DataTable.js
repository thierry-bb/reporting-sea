'use client';

import { useState } from 'react';
import styles from './DataTable.module.css';

/**
 * @param {string} title
 * @param {string} subtitle
 * @param {{ key: string, label: string, sortable?: boolean, align?: 'left'|'right', render?: (val, row) => ReactNode }[]} columns
 * @param {object[]} rows
 * @param {boolean} loading
 * @param {string} emptyMessage
 */
export default function DataTable({
  title,
  subtitle,
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = 'Aucune donnée',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    const factor = sortDir === 'asc' ? 1 : -1;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number') return (av - bv) * factor;
    return String(av).localeCompare(String(bv)) * factor;
  });

  const skeletonRows = Array(5).fill(null);

  return (
    <div className={styles.wrapper}>
      {(title || subtitle) && (
        <div className={styles.header}>
          <div>
            {title && <h3 className={styles.title} data-print-title>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  data-print-th
                  className={col.sortable ? styles.sortable : ''}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.label}
                  {col.sortable && (
                    <span className={`${styles.sortIcon} ${sortKey === col.key ? styles.active : ''}`}>
                      {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? skeletonRows.map((_, i) => (
                  <tr key={i} className={styles.skeletonRow}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        <div
                          className={styles.skeletonCell}
                          style={{ width: `${40 + Math.random() * 40}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className={styles.empty}>{emptyMessage}</div>
                    </td>
                  </tr>
                )
              : sorted.map((row, i) => (
                  <tr key={row.id ?? i}>
                    {columns.map((col) => (
                      <td key={col.key} className={col.align === 'right' ? styles.right : ''}>
                        {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
