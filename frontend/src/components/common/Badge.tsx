import React from 'react';

interface BadgeProps {
  variant: 'active' | 'lead' | 'inactive' | 'draft' | 'confirmed' | 'cancelled' | 'low-stock' | 'role' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};
