import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'indigo' | 'rose' | 'amber';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  icon
}) => {
  return (
    <span className={`badge badge-${variant} ${size === 'sm' ? 'text-xs py-0.5 px-2' : ''}`}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
