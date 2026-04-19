'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatCurrency, formatNumber } from '@/lib/formatters';

const STATUS_COLORS = {
  ACTIVE:    '#22c55e',
  PAUSED:    '#f59e0b',
  COMPLETED: '#888888',
  ARCHIVED:  '#888888',
  DRAFT:     '#888888',
};

const COLUMNS = [
  { key: 'campaign_name', label: 'Campagne',   render: (v) => v || '—' },
  { key: 'campaign_id',   label: 'ID',          align: 'right', render: (v) => v || '—' },
  {
    key: 'status',
    label: 'Statut',
    render: (v) => (
      <span style={{ color: STATUS_COLORS[v] || '#888888', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {v || '—'}
      </span>
    ),
  },
  { key: 'objective',     label: 'Objectif',    render: (v) => v || '—' },
  { key: 'impressions',   label: 'Impressions', align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'clicks',        label: 'Clics',       align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'conversions',   label: 'Conv.',       align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'cost_chf',      label: 'Coût',        align: 'right', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'conv_value_chf', label: 'Conv. Value', align: 'right', sortable: true, render: (v) => formatCurrency(v) },
];

export default function LinkedInCampaignsTable({ rows }) {
  return (
    <DataTable
      title="Campagnes LinkedIn"
      columns={COLUMNS}
      rows={rows}
      emptyMessage="Aucune campagne LinkedIn ce mois"
    />
  );
}
