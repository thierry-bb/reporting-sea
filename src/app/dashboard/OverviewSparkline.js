'use client';

import { ResponsiveContainer, LineChart, Line } from 'recharts';

export default function OverviewSparkline({ data, color }) {
  if (!data || data.length === 0) return <div style={{ height: 48 }} />;

  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div style={{ height: 48, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color || '#3B83DD'}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
