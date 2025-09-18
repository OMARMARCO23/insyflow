import React, { createContext, useContext, useMemo, useState } from 'react';
import en from '@/i18n/en';
import de from '@/i18n/de';
import es from '@/i18n/es';

type Lang = 'en' | 'de' | 'es';

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18N_KEY = 'insyflow_lang';

const LOCALES: Record<Lang, Record<string, string>> = { en, de, es };

const I18nContext = createContext<I18nCtx | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(I18N_KEY) as Lang | null;
    return saved || 'en';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem(I18N_KEY, l);
    setLangState(l);
  };

  const t = (key: string) => LOCALES[lang][key] ?? key;

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};