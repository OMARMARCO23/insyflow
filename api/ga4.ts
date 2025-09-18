import { BetaAnalyticsDataClient } from '@google-analytics/data';

type Range = '7d' | '30d' | '90d';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const propertyId = process.env.GA4_PROPERTY_ID;
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!propertyId || !keyJson) {
      res.status(500).json({ error: 'Missing GA4_PROPERTY_ID or GOOGLE_SERVICE_ACCOUNT_KEY' });
      return;
    }

    const sa = JSON.parse(keyJson);
    const private_key = String(sa.private_key || '').replace(/\\n/g, '\n');
    const client_email = sa.client_email as string;

    const analytics = new BetaAnalyticsDataClient({
      credentials: { client_email, private_key },
    });

    const range = (req.query.range as Range) || '30d';
    const { startDate, endDate, prevStartDate, prevEndDate } = buildPeriods(range);

    // 1) Totals current and previous (for change %)
    const [totCur] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' }
      ]
    });

    const [totPrev] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: prevStartDate, endDate: prevEndDate }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' }
      ]
    });

    const cur = getMetricsFromRows(totCur);
    const prev = getMetricsFromRows(totPrev);

    const avgEngagementSecCur = safeDiv(cur.userEngagementDuration, cur.sessions);
    const avgEngagementSecPrev = safeDiv(prev.userEngagementDuration, prev.sessions);

    const kpis = [
      kpi('users', 'kpi.users', cur.totalUsers, pct(cur.totalUsers, prev.totalUsers), 'number'),
      kpi('sessions', 'kpi.sessions', cur.sessions, pct(cur.sessions, prev.sessions), 'number'),
      kpi('pageviews', 'kpi.pageviews', cur.screenPageViews, pct(cur.screenPageViews, prev.screenPageViews), 'number'),
      kpi('engagement', 'kpi.avgEngagement', Math.round(avgEngagementSecCur), pct(avgEngagementSecCur, avgEngagementSecPrev), 'time'),
    ];

    // 2) Users trend
    const [trendRes] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      limit: 1000
    });
    const usersTrend = (trendRes.rows || []).map(r => {
      const ymd = r.dimensionValues?.[0]?.value || '';
      return { date: formatDate(ymd), users: toNum(r.metricValues?.[0]?.value) };
    });

    // 3) Traffic channels
    const [channelsRes] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10
    });
    const totalSessions = cur.sessions || 1;
    const trafficChannels = (channelsRes.rows || []).map(r => {
      const name = r.dimensionValues?.[0]?.value || 'Other';
      const sessions = toNum(r.metricValues?.[0]?.value);
      return { name, value: Math.round((sessions / totalSessions) * 100) };
    });

    // 4) Top pages
    const [pagesRes] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10
    });
    const topPages = (pagesRes.rows || []).map(r => ({
      path: r.dimensionValues?.[0]?.value || '/',
      views: toNum(r.metricValues?.[0]?.value),
      users: toNum(r.metricValues?.[1]?.value),
    }));

    res.status(200).json({
      kpis,
      usersTrend,
      trafficChannels,
      topPages
    });
  } catch (err: any) {
    console.error('GA4 error:', err);
    res.status(500).json({ error: 'GA4 request failed', details: err?.message });
  }
}

function buildPeriods(range: Range) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1); // yesterday
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (days - 1));

  const prevEnd = new Date(start);
  prevEnd.setUTCDate(start.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevEnd.getUTCDate() - (days - 1));

  return {
    startDate: toISO(start),
    endDate: toISO(end),
    prevStartDate: toISO(prevStart),
    prevEndDate: toISO(prevEnd)
  };
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function toNum(v?: string) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(yyyymmdd: string) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}`;
}

function safeDiv(a: number, b: number) {
  return b ? a / b : 0;
}

function pct(cur: number, prev: number) {
  if (!prev) return 0;
  return ((cur - prev) / prev) * 100;
}

function kpi(key: string, labelKey: string, value: number, changePct: number, format: 'number' | 'time') {
  return { key, labelKey, value, changePct, format };
}

function getMetricsFromRows(resp: any) {
  const row = resp.rows?.[0];
  const m = row?.metricValues || [];
  return {
    totalUsers: toNum(m[0]?.value),
    sessions: toNum(m[1]?.value),
    screenPageViews: toNum(m[2]?.value),
    userEngagementDuration: toNum(m[3]?.value)
  };
}