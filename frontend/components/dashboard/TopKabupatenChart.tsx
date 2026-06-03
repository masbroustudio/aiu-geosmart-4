'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopKabupatenChartProps {
  data: { name: string; avg_score: number }[];
}

export default function TopKabupatenChart({ data }: TopKabupatenChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Top 10 Kabupaten/Kota</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={75} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
              itemStyle={{ color: '#10B981' }}
            />
            <Bar dataKey="avg_score" fill="url(#kabupatenGradient)" radius={[0, 4, 4, 0]} animationBegin={200} />
            <defs>
              <linearGradient id="kabupatenGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1F4E79" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
