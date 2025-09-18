import React, { useState } from 'react';
import { useI18n } from '@/context/I18nContext';

type Range = '7d' | '30d' | '90d';

export const DateRangeSelector: React.FC<{ onChange?: (r: Range) => void }> = ({ onChange }) => {
  const { t } = useI18n();
  const [range, setRange] = useState<Range>('30d');

  const Button = ({ r, label }: { r: Range; label: string }) => (
    <button
      onClick={() => {
        setRange(r);
        onChange?.(r);
      }}
      className={`rounded-md border px-3 py-1 text-sm ${
        range === r
          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-200'
          : 'border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-2">
      <Button r="7d" label={t('dateRange.last7')} />
      <Button r="30d" label={t('dateRange.last30')} />
      <Button r="90d" label={t('dateRange.last90')} />
    </div>
  );
};