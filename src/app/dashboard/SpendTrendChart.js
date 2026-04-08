'use client';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { CHART_COLORS } from '@/lib/chartColors';
import { formatMonthShort, formatCurrency } from '@/lib/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(31,32,34,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function SpendTrendChart({ data, hasLinkedIn }) {
  const formatted = (data || []).map((d) => ({
    ...d,
    month: formatMonthShort(d.report_month),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis, paddingTop: 8 }}
        />
        <Line
          type="monotone"
          dataKey="google_spend"
          name="Google"
          stroke={CHART_COLORS.google}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: CHART_COLORS.google }}
        />
        <Line
          type="monotone"
          dataKey="meta_spend"
          name="Meta"
          stroke={CHART_COLORS.meta}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: CHART_COLORS.meta }}
        />
        {hasLinkedIn && (
          <Line
            type="monotone"
            dataKey="linkedin_spend"
            name="LinkedIn"
            stroke={CHART_COLORS.linkedin}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: CHART_COLORS.linkedin }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
