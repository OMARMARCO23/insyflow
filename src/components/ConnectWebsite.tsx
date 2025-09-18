import React, { useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { useWebsite } from '@/context/WebsiteContext';

export const ConnectWebsite: React.FC = () => {
  const { t } = useI18n();
  const { connect } = useWebsite();
  const [url, setUrl] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    connect(url.trim());
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">insyflow</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{t('onboarding.subtitle')}</p>
      </div>
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <label className="block text-sm font-medium">{t('onboarding.websiteLabel')}</label>
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-800"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t('onboarding.connect')}
        </button>
      </form>
    </div>
  );
};