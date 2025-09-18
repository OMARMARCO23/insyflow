import React, { useState } from 'react';
import { generateSeoInsights } from '@/lib/ai';
import { useI18n } from '@/context/I18nContext';
import { useWebsite } from '@/context/WebsiteContext';

type Props = {
  seoData: any;
};

export const SeoAiInsights: React.FC<Props> = ({ seoData }) => {
  const { t, lang } = useI18n() as any;
  const { website } = useWebsite();
  const [insights, setInsights] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!website) return;
    setLoading(true);
    setInsights(null);
    try {
      const res = await generateSeoInsights({ website, language: lang, seoData });
      setInsights(res);
    } catch {
      setInsights([t('ai.error')]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="card-title">{t('ai.seoInsightsTitle')}</div>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? t('ai.loading') : t('ai.generate')}
        </button>
      </div>
      {insights && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {insights.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
};