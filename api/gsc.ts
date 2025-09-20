import { google } from 'googleapis';

type Range = '7d' | '30d' | '90d';

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const siteUrl = process.env.GSC_SITE_URL;
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!siteUrl || !keyJson) return res.status(500).json({ error: 'Missing GSC_SITE_URL or GOOGLE_SERVICE_ACCOUNT_KEY' });

    const sa = JSON.parse(keyJson);
    const auth = new google.auth.JWT(
      sa.client_email,
      undefined,
      String(sa.private_key || '').replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/webmasters.readonly']
    );
    const sc = google.searchconsole({ version: 'v1', auth });

    const range = (req.query.range as Range) || '30d';
    const { startDate, endDate, prevStartDate, prevEndDate } = buildPeriods(range);

    const cur = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate }});
    const prev = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate: prevStartDate, endDate: prevEndDate }});

    const c = cur.data.rows?.[0]; const p = prev.data.rows?.[0];
    const clicks = Math.round(c?.clicks || 0), impressions = Math.round(c?.impressions || 0), ctr = (c?.ctr || 0) * 100, position = c?.position || 0;
    const clicksPrev = Math.round(p?.clicks || 0), impressionsPrev = Math.round(p?.impressions || 0), ctrPrev = (p?.ctr || 0) * 100, posPrev = p?.position || 0;

    const seoKpis = [
      kpi('clicks', 'kpi.totalClicks', clicks, pct(clicks, clicksPrev), 'number'),
      kpi('impressions', 'kpi.totalImpressions', impressions, pct(impressions, impressionsPrev), 'number'),
      kpi('ctr', 'kpi.avgCtr', ctr, pct(ctr, ctrPrev), 'percent'),
      kpi('position', 'kpi.avgPosition', position, pctReverse(position, posPrev), 'decimal'),
    ];

    const perf = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: ['date'], rowLimit: 1000 }});
    const performance = (perf.data.rows || []).map(r => ({ date: String(r.keys?.[0] || ''), clicks: Math.round(r.clicks || 0), impressions: Math.round(r.impressions || 0)}));
// inside handler, after reading env vars and before queries:
const searchType = (req.query.searchType as 'web' | 'image' | 'video' | 'news') || 'web';
const wide = req.query.wide === '1';

const r = (req.query.range as Range) || '30d';
const { startDate, endDate, prevStartDate, prevEndDate } = buildPeriods(r);

// ... when calling sc.searchanalytics.query, include searchType:
const cur = await sc.searchanalytics.query({
  siteUrl,
  requestBody: { startDate, endDate, searchType }
});
const prev = await sc.searchanalytics.query({
  siteUrl,
  requestBody: { startDate: prevStartDate, endDate: prevEndDate, searchType }
});

// Performance:
const perf = await sc.searchanalytics.query({
  siteUrl,
  requestBody: {
    startDate, endDate,
    dimensions: ['date'],
    rowLimit: 1000,
    searchType
  }
});

// If you want, add a “wide” fallback (16 months) when performance is empty:
if ((perf.data.rows || []).length === 0 && wide) {
  const start16 = iso(monthsAgo(16));
  const perfWide = await sc.searchanalytics.query({
    siteUrl,
    requestBody: { startDate: start16, endDate: iso(new Date()), dimensions: ['date'], rowLimit: 1000, searchType }
  });
  // replace performance with wide data for debug visibility
  performance = (perfWide.data.rows || []).map(r => ({
    date: String(r.keys?.[0] || ''),
    clicks: Math.round(r.clicks || 0),
    impressions: Math.round(r.impressions || 0)
  }));
}
    const queriesRes = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 10 }});
    const topQueries = (queriesRes.data.rows || []).map(r => ({ query: String(r.keys?.[0] || ''), clicks: Math.round(r.clicks || 0), impressions: Math.round(r.impressions || 0), ctr: (r.ctr || 0) * 100, position: r.position || 0 }));

    const pagesRes = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 10 }});
    const topPages = (pagesRes.data.rows || []).map(r => ({ path: toPath(String(r.keys?.[0] || '')), clicks: Math.round(r.clicks || 0), impressions: Math.round(r.impressions || 0), ctr: (r.ctr || 0) * 100, position: r.position || 0 }));

    // Cache for 5 minutes at the Edge, allow stale while revalidating
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    res.status(200).json({ seoKpis, performance, topQueries, topPages });
  } catch (err: any) {
    console.error('GSC error:', err);
    res.status(500).json({ error: 'GSC request failed', details: err?.message });
  }
}

function buildPeriods(range: Range) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const end = new Date(); end.setUTCDate(end.getUTCDate() - 2);
  const start = new Date(end); start.setUTCDate(end.getUTCDate() - (days - 1));
  const prevEnd = new Date(start); prevEnd.setUTCDate(start.getUTCDate() - 1);
  const prevStart = new Date(prevEnd); prevStart.setUTCDate(prevEnd.getUTCDate() - (days - 1));
  return { startDate: iso(start), endDate: iso(end), prevStartDate: iso(prevStart), prevEndDate: iso(prevEnd) };
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const kpi = (key: string, labelKey: string, value: number, changePct: number, format: 'number' | 'percent' | 'decimal') => ({ key, labelKey, value, changePct, format });
const pct = (cur: number, prev: number) => prev ? ((cur - prev) / prev) * 100 : 0;
const pctReverse = (cur: number, prev: number) => prev ? ((prev - cur) / prev) * 100 : 0;
const toPath = (full: string) => { try { return new URL(full).pathname || '/'; } catch { return full; } };

