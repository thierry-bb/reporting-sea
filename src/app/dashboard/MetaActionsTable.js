'use client';

import DataTable from '@/components/dashboard/DataTable';
import { formatNumber } from '@/lib/formatters';

const COLUMNS = [
  { key: 'action_type', label: "Type d'action" },
  { key: 'action_value', label: 'Valeur', align: 'right', sortable: true, render: (v) => formatNumber(v) },
];

export default function MetaActionsTable({ rows }) {
  const aggregated = Object.values(
    (rows || []).reduce((acc, row) => {
      const key = row.action_type;
      if (!acc[key]) acc[key] = { action_type: key, action_value: 0 };
      acc[key].action_value += Number(row.action_value) || 0;
      return acc;
    }, {})
  );

  return (
    <DataTable
      title="Actions"
      columns={COLUMNS}
      rows={aggregated}
      emptyMessage="Aucune action Meta ce mois"
      maxHeight="480px"
    />
  );
}
