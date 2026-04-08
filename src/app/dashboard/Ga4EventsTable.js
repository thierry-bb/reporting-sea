'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatNumber } from '@/lib/formatters';

const COLUMNS = [
  { key: 'event_name',  label: 'Événement' },
  { key: 'event_count', label: 'Nb événements', align: 'right', sortable: true, render: (v) => formatNumber(v) },
  { key: 'total_users', label: 'Utilisateurs',  align: 'right', sortable: true, render: (v) => formatNumber(v) },
];

export default function Ga4EventsTable({ rows }) {
  return (
    <DataTable
      title="Events"
      columns={COLUMNS}
      rows={rows || []}
      emptyMessage="Aucun événement GA4 ce mois"
      maxHeight="500px"
    />
  );
}
