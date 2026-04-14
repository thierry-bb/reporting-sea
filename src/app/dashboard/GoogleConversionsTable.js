'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatNumber } from '@/lib/formatters';

const COLUMNS = [
  { key: 'campaign_name', label: 'Campagne' },
  { key: 'conversion_name', label: 'Nom de conversion' },
  { key: 'conversions', label: 'Conversions', align: 'right', sortable: true, render: (v) => formatNumber(v) },
];

export default function GoogleConversionsTable({ rows }) {
  return (
    <DataTable
      title="Conversions"
      columns={COLUMNS}
      rows={rows}
      emptyMessage="Aucune donnée de conversions ce mois"
      maxHeight="480px"
    />
  );
}
