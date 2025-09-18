import React from 'react';

export const SettingsCard: React.FC<{ title: string; children: React.ReactNode; danger?: boolean }> = ({
  title,
  children,
  danger,
}) => {
  return (
    <div className={`card ${danger ? 'border-red-300 dark:border-red-900/50' : ''}`}>
      <div className={`mb-2 card-title ${danger ? 'text-red-600 dark:text-red-300' : ''}`}>{title}</div>
      {children}
    </div>
  );
};