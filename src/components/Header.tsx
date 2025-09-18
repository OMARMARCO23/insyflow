import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useWebsite } from '@/context/WebsiteContext';

export const Header: React.FC = () => {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const { website, disconnect } = useWebsite();

  const title = pathname.startsWith('/seo')
    ? t('nav.seo')
    : pathname.startsWith('/settings')
    ? t('nav.settings')
    : t('nav.dashboard');

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/70 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="md:hidden text-xl font-bold">insyflow</Link>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {website && (
          <div className="hidden items-center gap-2 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300 sm:flex">
            <span className="truncate max-w-[220px]">{website}</span>
            <button
              onClick={disconnect}
              className="rounded bg-gray-100 px-2 py-0.5 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              aria-label={t('header.disconnect')}
            >
              {t('header.disconnect')}
            </button>
          </div>
        )}
        <button
          onClick={toggle}
          className="rounded-md border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
          aria-label={t('header.toggleTheme')}
          title={t('header.toggleTheme')}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
};