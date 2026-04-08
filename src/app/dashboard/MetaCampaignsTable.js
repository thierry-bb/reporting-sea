'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatCurrency, formatNumber } from '@/lib/formatters';

const PLATFORM_LABELS = { facebook: 'Facebook', instagram: 'Instagram' };

const COLUMNS = [
  { key: 'campaign_name', label: 'Campagne', render: (v) => v || '—' },
  { key: 'platform',    label: 'Plateforme', render: (v) => PLATFORM_LABELS[v?.toLowerCase()] || v || '—' },
  { key: 'impressions', label: 'Impressions', align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'clicks',      label: 'Clics',       align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'ctr_total',   label: 'CTR',         align: 'right', sortable: true, render: (v) => v != null ? `${parseFloat(v).toFixed(2)}%` : '—' },
  { key: 'spend',       label: 'Coût',        align: 'right', sortable: true, render: (v) => formatCurrency(v) },
];

export default function MetaCampaignsTable({ rows }) {
  return (
    <DataTable
      title="Campagnes"
      columns={COLUMNS}
      rows={rows || []}
      emptyMessage="Aucune campagne Meta ce mois"
    />
  );
}
