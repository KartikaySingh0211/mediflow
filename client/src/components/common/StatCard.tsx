import React from 'react';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'indigo' | 'rose' | 'amber';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'cyan',
  trend
}) => {
  const bgGradients = {
    cyan: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(2, 132, 199, 0.05) 100%)',
    emerald: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
    indigo: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(79, 70, 229, 0.05) 100%)',
    rose: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(225, 29, 72, 0.05) 100%)',
    amber: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)'
  };

  const iconColors = {
    cyan: 'var(--primary-600)',
    emerald: 'var(--emerald-600)',
    indigo: 'var(--indigo-600)',
    rose: 'var(--rose-600)',
    amber: 'var(--amber-600)'
  };

  return (
    <GlassCard className="p-4" style={{ background: bgGradients[variant] }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</span>
        <div
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '0.625rem',
            background: 'rgba(255, 255, 255, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColors[variant],
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-bold">{value}</h4>
        {trend && (
          <span className="text-xs font-medium text-emerald">
            {trend}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-muted mt-1">{subtext}</p>}
    </GlassCard>
  );
};
