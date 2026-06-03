'use client';

import { motion } from 'framer-motion';
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

export default function KPICard({ icon: Icon, label, value, subtitle, color = '#10B981', trend = 'neutral', delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "glass-card p-6 border-l-4",
        trend === 'up' && "border-l-emerald-500",
        trend === 'down' && "border-l-red-500",
        trend === 'neutral' && "border-l-accent"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
            {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-400" />}
          </div>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${color}33, ${color}11)` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}
