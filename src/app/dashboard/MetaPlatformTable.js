'use client';

import { formatNumber, formatCurrency, calcDelta } from '@/lib/formatters';
import KpiCard from '@/components/dashboard/KpiCard';
import styles from './MetaPlatformTable.module.css';

const ALLOWED_PLATFORMS = new Set(['facebook', 'instagram']);

const PLATFORM_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
};

function aggregateByPlatform(rows) {
  const byPlatform = {};
  for (const row of (rows || [])) {
    const key = (row.platform || 'unknown').toLowerCase();
    if (!ALLOWED_PLATFORMS.has(key)) continue;
    if (!byPlatform[key]) {
      byPlatform[key] = { platform: key, impressions: 0, reach: 0, clicks: 0, page_likes: 0, spend: 0 };
    }
    byPlatform[key].impressions += Number(row.impressions) || 0;
    byPlatform[key].reach       += Number(row.reach)       || 0;
    byPlatform[key].clicks      += Number(row.clicks)      || 0;
    byPlatform[key].page_likes  += Number(row.page_likes)  || 0;
    byPlatform[key].spend       += Number(row.spend)       || 0;
  }
  return byPlatform;
}

export default function MetaPlatformTable({ rows, prevRows }) {
  const cur  = aggregateByPlatform(rows);
  const prev = aggregateByPlatform(prevRows);

  const platforms = Object.values(cur).map((p) => ({
    ...p,
    ctr:  p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0,
    prev: prev[p.platform] || null,
  }));

  if (platforms.length === 0) return null;

  return (
    <div className={styles.platformGroups}>
      {platforms.map((p) => {
        const pp = p.prev;
        const prevCtr = pp && pp.impressions > 0 ? (pp.clicks / pp.impressions) * 100 : null;
        return (
          <div key={p.platform} className={styles.group}>
            <div className={styles.platformLabel}>
              <span className={`${styles.badge} ${styles[p.platform]}`}>
                {PLATFORM_LABELS[p.platform] || p.platform}
              </span>
            </div>
            <div className={styles.kpiRow}>
              <KpiCard label="Impressions" value={formatNumber(p.impressions)} delta={calcDelta(p.impressions, pp?.impressions)} color="accent" />
              <KpiCard label="Reach"       value={formatNumber(p.reach)}       delta={calcDelta(p.reach,       pp?.reach)}       color="accent" />
              <KpiCard label="Clics"       value={formatNumber(p.clicks)}      delta={calcDelta(p.clicks,      pp?.clicks)}      color="accent" />
              <KpiCard label="Page Likes"  value={formatNumber(p.page_likes)}  delta={calcDelta(p.page_likes,  pp?.page_likes)}  color="accent" />
              <KpiCard label="CTR"         value={p.ctr > 0 ? `${p.ctr.toFixed(2)}%` : '—'} delta={calcDelta(p.ctr, prevCtr)} color="accent" />
              <KpiCard label="Coût"        value={formatCurrency(p.spend)}     delta={calcDelta(p.spend,       pp?.spend)}       color="accent" invertDelta />
            </div>
          </div>
        );
      })}
    </div>
  );
}
