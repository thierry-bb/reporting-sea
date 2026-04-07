'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatNumber } from '@/lib/formatters';

const COLUMNS = [
  {
    key: 'rank',
    label: '#',
    render: (v) => <span style={{ color: 'var(--color-text-muted)' }}>{v}</span>,
  },
  {
    key: 'page_url',
    label: 'Page',
    render: (v) => (
      <span title={v} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
        {v}
      </span>
    ),
  },
  { key: 'page_views', label: 'Vues', align: 'right', sortable: true, render: (v) => formatNumber(v) },
];

export default function TopPagesTable({ rows }) {
  return (
    <DataTable
      title="Top pages"
      columns={COLUMNS}
      rows={rows}
      emptyMessage="Aucune donnée de pages"
    />
  );
}
