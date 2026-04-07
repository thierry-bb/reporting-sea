'use client';

import { formatNumber, formatCurrency } from '@/lib/formatters';
import KpiCard from '@/components/dashboard/KpiCard';
import styles from './MetaPlatformTable.module.css';

const ALLOWED_PLATFORMS = new Set(['facebook', 'instagram']);

const PLATFORM_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
};

function aggregate(rows) {
  const byPlatform = {};
  for (const row of rows) {
    const key = (row.platform || 'unknown').toLowerCase();
    if (!ALLOWED_PLATFORMS.has(key)) continue;
    if (!byPlatform[key]) {
      byPlatform[key] = { platform: key, impressions: 0, reach: 0, clicks: 0, page_likes: 0, spend: 0, purchase_value: 0 };
    }
    byPlatform[key].impressions    += Number(row.impressions)    || 0;
    byPlatform[key].reach          += Number(row.reach)          || 0;
    byPlatform[key].clicks         += Number(row.clicks)         || 0;
    byPlatform[key].page_likes     += Number(row.page_likes)     || 0;
    byPlatform[key].spend          += Number(row.spend)          || 0;
    byPlatform[key].purchase_value += Number(row.purchase_value) || 0;
  }
  return Object.values(byPlatform);
}

export default function MetaPlatformTable({ rows }) {
  const platforms = aggregate(rows || []);

  if (platforms.length === 0) return null;

  return (
    <div className={styles.platformGroups}>
      {platforms.map((p) => (
        <div key={p.platform} className={styles.group}>
          <div className={styles.platformLabel}>
            <span className={`${styles.badge} ${styles[p.platform]}`}>
              {PLATFORM_LABELS[p.platform] || p.platform}
            </span>
          </div>
          <div className={styles.kpiRow}>
            <KpiCard label="Impressions"       value={formatNumber(p.impressions)}    color="accent" />
            <KpiCard label="Reach"             value={formatNumber(p.reach)}           color="accent" />
            <KpiCard label="Clics"             value={formatNumber(p.clicks)}          color="accent" />
            <KpiCard label="Page Likes"        value={formatNumber(p.page_likes)}      color="accent" />
            <KpiCard label="Coût"              value={formatCurrency(p.spend)}         color="accent" />
            <KpiCard label="Valeur achats"     value={formatCurrency(p.purchase_value)} color="accent" />
          </div>
        </div>
      ))}
    </div>
  );
}
