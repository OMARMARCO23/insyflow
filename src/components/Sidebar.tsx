import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';

const linkBase = 'px-3 py-2 rounded-md text-sm font-medium';
const linkActive = 'bg-brand-600 text-white';
const linkInactive = 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800';

export const Sidebar: React.FC = () => {
  const { t } = useI18n();

  const navItem = (to: string, label: string) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
    >
      {label}
    </NavLink>
  );

  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 p-4 dark:border-gray-800 md:block">
      <div className="mb-6 px-2">
        <div className="text-xl font-bold">insyflow</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Web Analytics</div>
      </div>
      <nav className="flex flex-col gap-2">
        {navItem('/dashboard', t('nav.dashboard'))}
        {navItem('/seo', t('nav.seo'))}
        {navItem('/settings', t('nav.settings'))}
      </nav>
    </aside>
  );
};