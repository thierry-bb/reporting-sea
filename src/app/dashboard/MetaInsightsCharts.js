'use client';

import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';
import { PIE_COLORS } from '@/lib/chartColors';
import styles from './MetaInsightsCharts.module.css';

const RADIAN = Math.PI / 180;

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="rgba(255,255,255,0.9)"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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
        {Number(item.value).toFixed(1)}%
      </p>
    </div>
  );
};

const TYPE_LABELS = {
  age:    'Par âge',
  gender: 'Par genre',
  region: 'Par région',
  country: 'Par pays',
};

const TYPE_ORDER = ['age', 'gender', 'region', 'country'];

// Values to exclude (negligible / unknown)
const EXCLUDE_VALUES = new Set(['unknown', 'Unknown', '']);

// Seuil en dessous duquel les tranches sont regroupées en "Autres"
const OTHERS_THRESHOLD = 2;

function InsightPie({ title, data }) {
  const filtered = data
    .filter((r) => !EXCLUDE_VALUES.has(r.breakdown_value) && parseFloat(r.percentage) > 0)
    .map((r) => ({ name: r.breakdown_value, value: parseFloat(r.percentage) }))
    .sort((a, b) => b.value - a.value);

  // Grouper les petites tranches en "Autres"
  const main = filtered.filter((r) => r.value >= OTHERS_THRESHOLD);
  const others = filtered.filter((r) => r.value < OTHERS_THRESHOLD);
  const othersSum = others.reduce((s, r) => s + r.value, 0);

  const chartData = othersSum > 0
    ? [...main, { name: 'Autres', value: parseFloat(othersSum.toFixed(1)) }]
    : main;

  return (
    <div className={styles.pieWrap}>
      <p className={styles.pieTitle}>{title}</p>
      {chartData.length === 0 ? (
        <div className={styles.empty}>Aucune donnée</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius="35%"
              outerRadius="62%"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              label={renderLabel}
              labelLine={false}
              stroke="none"
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={entry.name === 'Autres' ? 'rgba(255,255,255,0.15)' : PIE_COLORS[i % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(v) => <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function MetaInsightsCharts({ rows }) {
  if (!rows || rows.length === 0) return null;

  // Group rows by breakdown_type
  const byType = {};
  for (const row of rows) {
    const t = (row.breakdown_type || '').toLowerCase();
    if (!byType[t]) byType[t] = [];
    byType[t].push(row);
  }

  const types = TYPE_ORDER.filter((t) => byType[t]);
  if (types.length === 0) return null;

  return (
    <div className={styles.container}>
      <p className={styles.sectionLabel}>Démographie des impressions</p>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${types.length}, 1fr)` }}>
        {types.map((t) => (
          <InsightPie
            key={t}
            title={TYPE_LABELS[t] || t}
            data={byType[t]}
          />
        ))}
      </div>
    </div>
  );
}
