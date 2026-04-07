'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatNumber } from '@/lib/formatters';

const COLUMNS = [
  { key: 'action_type', label: "Type d'action" },
  { key: 'action_value', label: 'Valeur', align: 'right', sortable: true, render: (v) => formatNumber(v) },
];

export default function MetaActionsTable({ rows }) {
  return (
    <DataTable
      title="Actions"
      columns={COLUMNS}
      rows={rows}
      emptyMessage="Aucune action Meta ce mois"
    />
  );
}
