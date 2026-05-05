'use client';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div style={{
      background: 'rgba(31,32,34,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#3B83DD', fontWeight: 600 }}>
        {value != null ? `${Number(value).toLocaleString('fr-CH', { maximumFractionDigits: 0 })} CHF` : '—'}
      </p>
    </div>
  );
};

export default function OverviewTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
        Aucune donnée
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--color-text-muted, rgba(255,255,255,0.4))', fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--color-text-muted, rgba(255,255,255,0.3))', fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3B83DD"
          strokeWidth={2}
          dot={{ r: 3, fill: '#3B83DD', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#3B83DD', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
