import React from 'react';
import clsx from 'clsx';

type Props = {
  title: string;
  value: string | number;
  changePct: number;
};

function formatValue(val: string | number) {
  if (typeof val === 'number') return val.toLocaleString();
  return val;
}

export const KpiCard: React.FC<Props> = ({ title, value, changePct }) => {
  const positive = changePct >= 0;
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-semibold">{formatValue(value)}</div>
        <div
          className={clsx(
            'rounded-md px-2 py-0.5 text-sm',
            positive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          )}
          aria-label={positive ? 'Positive change' : 'Negative change'}
        >
          {positive ? '▲' : '▼'} {Math.abs(changePct).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};