'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SHAPContribution {
  name: string;
  value: number;
  isPositive: boolean;
}

interface SHAPInteractiveWaterfallProps {
  contributions: SHAPContribution[];
  finalScore: number;
  baseScore?: number;
}

export default function SHAPInteractiveWaterfall({
  contributions,
  finalScore,
  baseScore = 650
}: SHAPInteractiveWaterfallProps) {
  
  let currentScore = baseScore;
  const chartData: any[] = [];

  // 1. Add Base Intercept
  chartData.push({
    name: 'Base Intercept',
    displayRange: [0, baseScore],
    value: baseScore,
    color: '#475569', // Slate-600
    tooltipValue: baseScore
  });

  // 2. Add each contribution
  contributions.forEach((c) => {
    if (c.name.toLowerCase().includes('base')) return; // Skip if it's base intercept

    const start = currentScore;
    const change = c.isPositive ? c.value : -c.value;
    currentScore += change;
    
    // Model bounds cap
    currentScore = Math.min(850, Math.max(300, currentScore));
    const end = currentScore;

    chartData.push({
      name: c.name,
      displayRange: [start, end],
      value: change,
      color: c.isPositive ? '#10B981' : '#EF4444', // Emerald-500 or Red-500
      tooltipValue: change >= 0 ? `+${change}` : change
    });
  });

  // 3. Add Final Score
  chartData.push({
    name: 'Final Score',
    displayRange: [0, finalScore],
    value: finalScore,
    color: '#0EA5E9', // Sky-500 (Primary accent)
    tooltipValue: finalScore
  });

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-200">{data.name}</p>
          <p className="text-slate-400">
            Nilai Kontribusi: <span className="font-bold font-mono" style={{ color: data.color }}>{data.tooltipValue}</span>
          </p>
          {data.displayRange[0] > 0 && (
            <p className="text-[10px] text-slate-500 font-mono">
              Rentang: {data.displayRange[0]} → {data.displayRange[1]}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-500 font-semibold">Aliran Prediksi SHAP</span>
        <div className="flex gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-sm" /> Naik (+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-sm" /> Turun (-)
          </span>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis
              type="number"
              domain={[300, 850]}
              tick={{ fill: '#64748b', fontSize: 9 }}
              stroke="#334155"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 9 }}
              width={100}
              stroke="#334155"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="displayRange" radius={[3, 3, 3, 3]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
