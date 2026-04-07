'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';

const COLUMNS = [
  { key: 'campaign_name', label: 'Campagne', render: (v) => v || '—' },
  { key: 'impressions', label: 'Impressions', align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'clicks', label: 'Clics', align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'ctr', label: 'CTR', align: 'right', sortable: true, render: (v) => formatPercent(v) },
  { key: 'cost_actual', label: 'Coût', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'conversions', label: 'Conv.', align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'conversions_value', label: "Chiffre d'affaire", align: 'right', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'roas', label: 'ROAS', align: 'right', sortable: true, render: (v) => v != null ? `${parseFloat(v).toFixed(2)}x` : '—' },
];

export default function GoogleCampaignsTable({ rows }) {
  return (
    <DataTable
      title="Campagnes"
      columns={COLUMNS}
      rows={rows}
      emptyMessage="Aucune campagne Google Ads ce mois"
    />
  );
}
