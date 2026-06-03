'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface SHAPWaterfallChartProps {
  explanations: { feature: string; contribution: number }[];
  bandName: string;
}

export default function SHAPWaterfallChart({ explanations, bandName }: SHAPWaterfallChartProps) {
  // Sort by absolute contribution descending
  const sorted = [...explanations].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const chartData = sorted.map((item) => ({
    feature: item.feature,
    contribution: item.contribution,
  }));

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-300 mb-3">
        Score Drivers for {bandName}
      </h4>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              domain={['dataMin - 0.05', 'dataMax + 0.05']}
            />
            <YAxis
              type="category"
              dataKey="feature"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              width={110}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
              formatter={(value) => [`${Number(value).toFixed(3)}`, 'Contribution']}
            />
            <ReferenceLine x={0} stroke="#64748b" strokeWidth={1} />
            <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.contribution >= 0 ? '#10B981' : '#EF4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
