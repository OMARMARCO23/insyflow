import React, { useEffect, useMemo, useState } from 'react';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { KpiCard } from '@/components/KpiCard';
import { ChartCard } from '@/components/ChartCard';
import { SeoAiInsights } from '@/components/SeoAiInsights';
import { useI18n } from '@/context/I18nContext';
import { SEO_KPIS, SEARCH_PERFORMANCE, TOP_QUERIES, TOP_SEO_PAGES } from '@/constants';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { fetchSeo, type Range } from '@/lib/data';

export const SeoInsights: React.FC = () => {
  const { t } = useI18n();
  const [range, setRange] = useState<Range>('30d');

  const [seoKpis, setSeoKpis] = useState(SEO_KPIS);
  const [performance, setPerformance] = useState(SEARCH_PERFORMANCE);
  const [queries, setQueries] = useState(TOP_QUERIES);
  const [pages, setPages] = useState(TOP_SEO_PAGES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchSeo(range);
        if (!cancelled) {
          setSeoKpis(data.seoKpis);
          setPerformance(data.performance);
          setQueries(data.topQueries);
          setPages(data.topPages);
        }
      } catch {
        // keep mock data on failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [range]);

  const [qSort, setQSort] = useState<'query' | 'clicks' | 'impressions' | 'ctr' | 'position'>('clicks');
  const [qDir, setQDir] = useState<'asc' | 'desc'>('desc');

  const [pSort, setPSort] = useState<'path' | 'clicks' | 'impressions' | 'ctr' | 'position'>('clicks');
  const [pDir, setPDir] = useState<'asc' | 'desc'>('desc');

  const sortedQueries = useMemo(() => {
    const arr = [...queries];
    const dir = qDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (qSort) {
        case 'query': return a.query.localeCompare(b.query) * dir;
        case 'clicks': return (a.clicks - b.clicks) * dir;
        case 'impressions': return (a.impressions - b.impressions) * dir;
        case 'ctr': return (a.ctr - b.ctr) * dir;
        case 'position': return (a.position - b.position) * dir;
      }
    });
    return arr;
  }, [queries, qSort, qDir]);

  const sortedPages = useMemo(() => {
    const arr = [...pages];
    const dir = pDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (pSort) {
        case 'path': return a.path.localeCompare(b.path) * dir;
        case 'clicks': return (a.clicks - b.clicks) * dir;
        case 'impressions': return (a.impressions - b.impressions) * dir;
        case 'ctr': return (a.ctr - b.ctr) * dir;
        case 'position': return (a.position - b.position) * dir;
      }
    });
    return arr;
  }, [pages, pSort, pDir]);

  const seoDataForAi = {
    kpis: seoKpis,
    performance,
    topQueries: queries,
    topPages: pages,
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <DateRangeSelector onChange={(r) => setRange(r as Range)} />
        {loading && <span className="text-xs text-gray-500">Loading…</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {seoKpis.map(k => (
          <KpiCard
            key={k.key}
            title={t(k.labelKey)}
            value={
              k.format === 'percent' ? `${k.value.toFixed(1)}%` :
              k.format === 'decimal' ? k.value.toFixed(1) :
              k.value
            }
            changePct={0}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title={t('charts.searchPerformance')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance}>
              <XAxis dataKey="date" hide />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#3f8fff" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#60a8ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <SeoAiInsights seoData={seoDataForAi} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-2 card-title">{t('tables.topQueries')}</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  {head('query', t('tables.query'), setQSort, setQDir, qSort, qDir)}
                  {head('clicks', t('tables.clicks'), setQSort, setQDir, qSort, qDir)}
                  {head('impressions', t('tables.impressions'), setQSort, setQDir, qSort, qDir)}
                  {head('ctr', t('tables.ctr'), setQSort, setQDir, qSort, qDir)}
                  {head('position', t('tables.position'), setQSort, setQDir, qSort, qDir)}
                </tr>
              </thead>
              <tbody>
                {sortedQueries.map(q => (
                  <tr key={q.query} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{q.query}</td>
                    <td className="px-3 py-2">{q.clicks.toLocaleString()}</td>
                    <td className="px-3 py-2">{q.impressions.toLocaleString()}</td>
                    <td className="px-3 py-2">{q.ctr.toFixed(1)}%</td>
                    <td className="px-3 py-2">{q.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="mb-2 card-title">{t('tables.topPagesSeo')}</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  {head('path', t('tables.page'), setPSort, setPDir, pSort, pDir)}
                  {head('clicks', t('tables.clicks'), setPSort, setPDir, pSort, pDir)}
                  {head('impressions', t('tables.impressions'), setPSort, setPDir, pSort, pDir)}
                  {head('ctr', t('tables.ctr'), setPSort, setPDir, pSort, pDir)}
                  {head('position', t('tables.position'), setPSort, setPDir, pSort, pDir)}
                </tr>
              </thead>
              <tbody>
                {sortedPages.map(p => (
                  <tr key={p.path} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{p.path}</td>
                    <td className="px-3 py-2">{p.clicks.toLocaleString()}</td>
                    <td className="px-3 py-2">{p.impressions.toLocaleString()}</td>
                    <td className="px-3 py-2">{p.ctr.toFixed(1)}%</td>
                    <td className="px-3 py-2">{p.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  function head<T extends string>(
    col: T,
    label: string,
    setSort: (c: any) => void,
    setDir: (d: any) => void,
    active: T,
    dir: 'asc' | 'desc'
  ) {
    const isActive = active === col;
    return (
      <th
        key={String(col)}
        className="cursor-pointer px-3 py-2"
        onClick={() => {
          if (isActive) setDir(dir === 'asc' ? 'desc' : 'asc');
          else {
            setSort(col);
            setDir('desc');
          }
        }}
      >
        {label} {isActive ? (dir === 'asc' ? '▲' : '▼') : ''}
      </th>
    );
  }
};
