'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatNumber, formatPercent, formatMonth } from '@/lib/formatters';

const COLUMNS = [
  {
    key: 'rank',
    label: '#',
    render: (v) => <span style={{ color: 'var(--color-text-muted)' }}>{v}</span>,
  },
  { key: 'query', label: 'Requête' },
  { key: 'clicks', label: 'Clics', align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'impressions', label: 'Impressions', align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'ctr', label: 'CTR', align: 'right', sortable: true, render: (v) => formatPercent(v) },
  {
    key: 'position',
    label: 'Position moy.',
    align: 'right',
    sortable: true,
    render: (v) => {
      const pos = parseFloat(v);
      const color = pos <= 3 ? 'var(--color-green)' : pos <= 10 ? 'var(--color-warning)' : 'var(--color-danger)';
      return <span style={{ color, fontWeight: 600 }}>{pos.toFixed(1)}</span>;
    },
  },
];

export default function GscQueriesTable({ rows, subtitle }) {
  return (
    <DataTable
      title="Top requêtes"
      subtitle={subtitle}
      columns={COLUMNS}
      rows={rows}
      emptyMessage="Aucune donnée GSC ce mois"
    />
  );
}
