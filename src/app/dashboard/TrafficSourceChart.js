'use client';

import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';
import { PIE_COLORS } from '@/lib/chartColors';
import { formatNumber } from '@/lib/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{
      background: 'rgba(31,32,34,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <p style={{ color: item.payload.fill, fontWeight: 600 }}>{item.name}</p>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
        {formatNumber(item.value)} utilisateurs
      </p>
    </div>
  );
};

const RADIAN = Math.PI / 180;

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.9)" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function TrafficSourceChart({ data }) {
  const sorted = [...(data || [])].sort((a, b) => b.users - a.users).slice(0, 8);

  if (!sorted.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
      Aucune donnée
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={sorted}
          dataKey="users"
          nameKey="source_medium"
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="70%"
          paddingAngle={3}
          label={renderLabel}
          labelLine={false}
          stroke="none"
        >
          {sorted.map((entry, i) => (
            <Cell key={entry.source_medium} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(v) => <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
