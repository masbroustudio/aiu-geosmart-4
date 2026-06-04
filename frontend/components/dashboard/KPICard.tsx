'use client';

import { motion } from 'framer-motion';
import { type LucideIcon, ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
  labelTooltip?: string;
}

export default function KPICard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  color = '#10B981', 
  trend = 'neutral', 
  delay = 0,
  labelTooltip
}: KPICardProps) {
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
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm text-slate-400">{label}</span>
            {labelTooltip && (
              <div className="group relative pointer-events-auto">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[9.5px] text-slate-300 font-normal shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 leading-normal pointer-events-none">
                  {labelTooltip}
                </div>
              </div>
            )}
          </div>
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
