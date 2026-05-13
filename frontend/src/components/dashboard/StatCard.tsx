import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
  color: string;
  bg: string;
  delay?: number;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, trend, icon, color, bg, delay = 0, onClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'card p-5 flex items-start gap-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:border-dark-600 hover:shadow-card-hover'
      )}
    >
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
        <div className={color}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-dark-500 font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-dark-100">{value}</p>
        {subtitle && <p className="text-xs text-dark-500 mt-0.5 truncate">{subtitle}</p>}
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 mt-1.5 text-xs font-medium',
            trend.value > 0 ? 'text-green-400' :
            trend.value < 0 ? 'text-red-400' : 'text-dark-500'
          )}>
            {trend.value > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
             trend.value < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
             <Minus className="w-3.5 h-3.5" />}
            {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
