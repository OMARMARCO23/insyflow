import React, { useEffect, useMemo, useState } from 'react';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { KpiCard } from '@/components/KpiCard';
import { ChartCard } from '@/components/ChartCard';
import { AiInsights } from '@/components/AiInsights';
import { AskAi } from '@/components/AskAi';
import { useI18n } from '@/context/I18nContext';
import { DASHBOARD_KPIS, USERS_TREND, TRAFFIC_CHANNELS, TOP_PAGES } from '@/constants';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchDashboard, type Range } from '@/lib/data';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const COLORS = ['#3f8fff', '#2c73e6', '#60a8ff', '#8ec2ff', '#badbff'];

export const Dashboard: React.FC = () => {
  const { t } = useI18n();
  const [range, setRange] = useState<Range>('30d');

  // Data state (with fallback to mock if fetch fails)
  const [kpis, setKpis] = useState(DASHBOARD_KPIS);
  const [usersTrend, setUsersTrend] = useState(USERS_TREND);
  const [trafficChannels, setTrafficChannels] = useState(TRAFFIC_CHANNELS);
  const [topPages, setTopPages] = useState(TOP_PAGES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchDashboard(range);
        if (!cancelled) {
          setKpis(data.kpis);
          setUsersTrend(data.usersTrend);
          setTrafficChannels(data.trafficChannels);
          setTopPages(data.topPages);
        }
      } catch {
        // Keep mock data on failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const [sortBy, setSortBy] = useState<'path' | 'views' | 'users'>('views');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedPages = useMemo(() => {
    const arr = [...topPages];
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'path') return a.path.localeCompare(b.path) * dir;
      if (sortBy === 'views') return (a.views - b.views) * dir;
      return (a.users - b.users) * dir;
    });
    return arr;
  }, [topPages, sortBy, sortDir]);

  const dashboardDataForAi = {
    kpis,
    usersTrend,
    trafficChannels,
    topPages,
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <DateRangeSelector onChange={(r) => setRange(r as Range)} />
        {loading && <span className="text-xs text-gray-500">{t('ai.loading')}</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.key}
            title={t(kpi.labelKey)}
            value={
              kpi.format === 'time'
                ? formatTime(kpi.value)
                : kpi.format === 'percent'
                ? `${(kpi.value as number).toFixed(1)}%`
                : kpi.format === 'decimal'
                ? (kpi.value as number).toFixed(1)
                : (kpi.value as number)
            }
            changePct={kpi.changePct}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title={t('charts.usersTrend')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usersTrend}>
              <XAxis dataKey="date" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#3f8fff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('charts.trafficChannels')}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={trafficChannels} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {trafficChannels.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <AiInsights dashboardData={dashboardDataForAi} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-2 card-title">{t('tables.topPages')}</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="cursor-pointer px-3 py-2" onClick={() => toggleSort('path')}>{t('tables.page')}</th>
                  <th className="cursor-pointer px-3 py-2" onClick={() => toggleSort('views')}>{t('tables.views')}</th>
                  <th className="cursor-pointer px-3 py-2" onClick={() => toggleSort('users')}>{t('tables.users')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPages.map((p) => (
                  <tr key={p.path} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{p.path}</td>
                    <td className="px-3 py-2">{p.views.toLocaleString()}</td>
                    <td className="px-3 py-2">{p.users.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AskAi dashboardData={dashboardDataForAi} />
      </div>
    </div>
  );

  function toggleSort(col: 'path' | 'views' | 'users') {
    if (sortBy === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('desc');
    }
  }
};
