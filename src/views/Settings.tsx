import React from 'react';
import { SettingsCard } from '@/components/SettingsCard';
import { useI18n } from '@/context/I18nContext';
import { useWebsite } from '@/context/WebsiteContext';

export const Settings: React.FC = () => {
  const { t, lang, setLang } = useI18n() as any;
  const { website, disconnect, removeWebsite } = useWebsite();

  return (
    <div className="space-y-4 p-4">
      <SettingsCard title={t('settings.language')}>
        <div className="flex items-center gap-3">
          <label className="text-sm">{t('settings.languageLabel')}</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-800"
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
          </select>
        </div>
      </SettingsCard>

      <SettingsCard title={t('settings.website')}>
        <div className="flex flex-col gap-2 text-sm">
          <div>
            <span className="font-medium">{t('settings.connectedWebsite')}:</span>{' '}
            <span className="text-gray-700 dark:text-gray-300">{website ?? t('settings.none')}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={disconnect}
              className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              {t('settings.disconnect')}
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t('settings.dangerZone')} danger>
        <p className="mb-3 text-sm text-red-600 dark:text-red-300">{t('settings.dangerHint')}</p>
        <button
          onClick={() => {
            if (confirm(t('settings.confirmRemove'))) removeWebsite();
          }}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {t('settings.removeWebsite')}
        </button>
      </SettingsCard>
    </div>
  );
};