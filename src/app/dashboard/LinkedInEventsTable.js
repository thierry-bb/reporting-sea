'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatNumber } from '@/lib/formatters';

const COLUMNS = [
  { key: 'conversion_name', label: 'Nom des conversions', render: (v) => v || '—' },
  { key: 'conversions', label: 'Conversions', align: 'right', sortable: true, render: (v) => formatNumber(v) },
];

export default function LinkedInEventsTable({ rows }) {
  return (
    <DataTable
      title="Conversions"
      columns={COLUMNS}
      rows={rows || []}
      emptyMessage="Aucune conversion LinkedIn ce mois"
    />
  );
}
