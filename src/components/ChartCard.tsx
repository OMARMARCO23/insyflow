import React from 'react';

export const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="card">
      <div className="mb-2 card-title">{title}</div>
      <div className="h-64">{children}</div>
    </div>
  );
};