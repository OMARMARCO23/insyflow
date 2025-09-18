import type {
  Kpi,
  UsersTrendPoint,
  TrafficChannel,
  TopPage,
  SeoKpi,
  SearchPerfPoint,
  TopQuery,
  SeoPage,
} from './types';

export const DASHBOARD_KPIS: Kpi[] = [
  { key: 'users', labelKey: 'kpi.users', value: 12890, changePct: 8.4, format: 'number' },
  { key: 'sessions', labelKey: 'kpi.sessions', value: 19670, changePct: 5.2, format: 'number' },
  { key: 'pageviews', labelKey: 'kpi.pageviews', value: 48210, changePct: -2.9, format: 'number' },
  { key: 'engagement', labelKey: 'kpi.avgEngagement', value: 212, changePct: 3.1, format: 'time' }, // seconds
];

export const USERS_TREND: UsersTrendPoint[] = Array.from({ length: 30 }).map((_, i) => {
  const day = i + 1;
  const users = 300 + Math.round(Math.sin(i / 4) * 60) + Math.round(Math.random() * 40);
  return { date: `2025-08-${String(day).padStart(2, '0')}`, users };
});

export const TRAFFIC_CHANNELS: TrafficChannel[] = [
  { name: 'Organic Search', value: 58 },
  { name: 'Direct', value: 22 },
  { name: 'Referral', value: 12 },
  { name: 'Social', value: 8 },
];

export const TOP_PAGES: TopPage[] = [
  { path: '/', views: 12400, users: 8900 },
  { path: '/blog/how-to-grow', views: 6400, users: 4300 },
  { path: '/pricing', views: 5200, users: 4000 },
  { path: '/blog/seo-tips', views: 4800, users: 3500 },
  { path: '/about', views: 3500, users: 2900 },
];

export const SEO_KPIS: SeoKpi[] = [
  { key: 'clicks', labelKey: 'kpi.totalClicks', value: 5820, format: 'number' },
  { key: 'impressions', labelKey: 'kpi.totalImpressions', value: 212000, format: 'number' },
  { key: 'ctr', labelKey: 'kpi.avgCtr', value: 2.7, format: 'percent' },
  { key: 'position', labelKey: 'kpi.avgPosition', value: 18.3, format: 'decimal' },
];

export const SEARCH_PERFORMANCE: SearchPerfPoint[] = Array.from({ length: 30 }).map((_, i) => {
  const day = i + 1;
  const clicks = 120 + Math.round(Math.sin(i / 3.5) * 25) + Math.round(Math.random() * 15);
  const impressions = 5000 + Math.round(Math.cos(i / 3) * 800) + Math.round(Math.random() * 300);
  return {
    date: `2025-08-${String(day).padStart(2, '0')}`,
    clicks,
    impressions,
  };
});

export const TOP_QUERIES: TopQuery[] = [
  { query: 'best seo tips', clicks: 820, impressions: 21000, ctr: 3.9, position: 9.2 },
  { query: 'product name', clicks: 640, impressions: 13000, ctr: 4.9, position: 6.5 },
  { query: 'pricing product name', clicks: 420, impressions: 8700, ctr: 4.8, position: 5.2 },
  { query: 'how to grow traffic', clicks: 330, impressions: 12000, ctr: 2.7, position: 11.3 },
  { query: 'blog ideas', clicks: 290, impressions: 9600, ctr: 3.0, position: 10.7 },
];

export const TOP_SEO_PAGES: SeoPage[] = [
  { path: '/blog/how-to-grow', clicks: 1200, impressions: 42000, ctr: 2.9, position: 7.2 },
  { path: '/pricing', clicks: 980, impressions: 24000, ctr: 4.1, position: 5.8 },
  { path: '/blog/seo-tips', clicks: 780, impressions: 20000, ctr: 3.9, position: 8.1 },
  { path: '/', clicks: 610, impressions: 35000, ctr: 1.7, position: 12.3 },
  { path: '/about', clicks: 430, impressions: 11000, ctr: 3.9, position: 9.4 },
];