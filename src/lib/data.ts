import type { Kpi, UsersTrendPoint, TrafficChannel, TopPage, SeoKpi, SearchPerfPoint, TopQuery, SeoPage } from '@/types';

export type Range = '7d' | '30d' | '90d';

export type DashboardData = {
  kpis: Kpi[];
  usersTrend: UsersTrendPoint[];
  trafficChannels: TrafficChannel[];
  topPages: TopPage[];
};

export type SeoData = {
  seoKpis: SeoKpi[];
  performance: SearchPerfPoint[];
  topQueries: TopQuery[];
  topPages: SeoPage[];
};

export async function fetchDashboard(range: Range): Promise<DashboardData> {
  const res = await fetch(`/api/ga4?range=${range}`);
  if (!res.ok) throw new Error('GA4 fetch failed');
  return res.json();
}

export async function fetchSeo(range: Range): Promise<SeoData> {
  const res = await fetch(`/api/gsc?range=${range}`);
  if (!res.ok) throw new Error('GSC fetch failed');
  return res.json();
}