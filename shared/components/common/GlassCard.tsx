import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevated = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`${elevated ? 'glass-elevated' : 'glass-card'} ${glow ? 'pulse-glow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
