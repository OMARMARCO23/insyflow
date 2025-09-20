import { BetaAnalyticsDataClient } from '@google-analytics/data';

type Range = '7d' | '30d' | '90d';

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!propertyId || !keyJson) {
      return res.status(500).json({ error: 'Missing GA4_PROPERTY_ID or GOOGLE_SERVICE_ACCOUNT_KEY' });
    }

    const sa = JSON.parse(keyJson);
    const analytics = new BetaAnalyticsDataClient({
      credentials: { client_email: sa.client_email, private_key: String(sa.private_key || '').replace(/\\n/g, '\n') },
    });

    const range = (req.query.range as Range) || '30d';
    const { start, end, prevStart, prevEnd } = buildPeriods(range);

    const [totCur] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: start, endDate: end }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' }
      ]
    });

    const [totPrev] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: prevStart, endDate: prevEnd }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' }
      ]
    });

    const cur = getMetricsFromRows(totCur);
    const prev = getMetricsFromRows(totPrev);
    const avgEng = safeDiv(cur.userEngagementDuration, cur.sessions);
    const avgEngPrev = safeDiv(prev.userEngagementDuration, prev.sessions);

    const kpis = [
      kpi('users', 'kpi.users', cur.totalUsers, pct(cur.totalUsers, prev.totalUsers), 'number'),
      kpi('sessions', 'kpi.sessions', cur.sessions, pct(cur.sessions, prev.sessions), 'number'),
      kpi('pageviews', 'kpi.pageviews', cur.screenPageViews, pct(cur.screenPageViews, prev.screenPageViews), 'number'),
      kpi('engagement', 'kpi.avgEngagement', Math.round(avgEng), pct(avgEng, avgEngPrev), 'time'),
    ];

    const [trendRes] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      limit: 1000
    });
    const usersTrend = (trendRes.rows || []).map(r => ({
      date: formatDate(r.dimensionValues?.[0]?.value || ''),
      users: toNum(r.metricValues?.[0]?.value),
    }));

    const [channelsRes] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: start, endDate: end }],
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

    const [pagesRes] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: start, endDate: end }],
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

    // Cache for 5 minutes at the Edge, allow stale while revalidating
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    res.status(200).json({ kpis, usersTrend, trafficChannels, topPages });
  } catch (err: any) {
    console.error('GA4 error:', err);
    res.status(500).json({ error: 'GA4 request failed', details: err?.message });
  }
}

function buildPeriods(range: Range) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const start = `${days - 1}daysAgo`;
  const end = 'today';
  const prevStart = `${2 * days - 1}daysAgo`;
  const prevEnd = `${days}daysAgo`;
  return { start, end, prevStart, prevEnd };
}

const toNum = (v?: string) => Number.isFinite(Number(v || 0)) ? Number(v) : 0;
const formatDate = (yyyymmdd: string) => yyyymmdd.length === 8 ? `${yyyymmdd.slice(0,4)}-${yyyymmdd.slice(4,6)}-${yyyymmdd.slice(6)}` : yyyymmdd;
const safeDiv = (a: number, b: number) => b ? a / b : 0;
const pct = (cur: number, prev: number) => prev ? ((cur - prev) / prev) * 100 : 0;
const kpi = (key: string, labelKey: string, value: number, changePct: number, format: 'number' | 'time') => ({ key, labelKey, value, changePct, format });
function getMetricsFromRows(resp: any) {
  const m = resp.rows?.[0]?.metricValues || [];
  return { totalUsers: toNum(m[0]?.value), sessions: toNum(m[1]?.value), screenPageViews: toNum(m[2]?.value), userEngagementDuration: toNum(m[3]?.value) };
}
