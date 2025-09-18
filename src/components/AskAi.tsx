import React, { useState } from 'react';
import { askAi } from '@/lib/ai';
import { useI18n } from '@/context/I18nContext';
import { useWebsite } from '@/context/WebsiteContext';

type Props = {
  dashboardData: any;
};

export const AskAi: React.FC<Props> = ({ dashboardData }) => {
  const { t, lang } = useI18n() as any;
  const { website } = useWebsite();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim() || !website) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await askAi({ question, website, language: lang, dashboardData });
      setAnswer(res);
    } catch (e) {
      setAnswer(t('ai.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title mb-2">{t('ai.askTitle')}</div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            value={question}
            placeholder={t('ai.askPlaceholder')}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            className="flex-1 rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-800"
          />
          <button
            onClick={ask}
            disabled={loading || !question.trim()}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? t('ai.loading') : t('ai.askButton')}
          </button>
        </div>
        {answer && (
          <div className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
            {answer.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};