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
    if (!siteUrl || !keyJson) {
      return res.status(500).json({ error: 'Missing GSC_SITE_URL or GOOGLE_SERVICE_ACCOUNT_KEY' });
    }

    const sa = JSON.parse(keyJson);
    const privateKey = String(sa.private_key || '').replace(/\\n/g, '\n');
    const clientEmail: string = sa.client_email;

    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ['https://www.googleapis.com/auth/webmasters.readonly']
    );
    const sc = google.searchconsole({ version: 'v1', auth });

    const rangeParam = (req.query.range as string) || '30d';
    const range: Range = (['7d', '30d', '90d'].includes(rangeParam) ? (rangeParam as Range) : '30d');
    const searchType = (req.query.searchType as 'web' | 'image' | 'video' | 'news') || 'web';

    const { startDate, endDate, prevStartDate, prevEndDate } = buildPeriods(range);

    // KPIs (current)
    const curRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, searchType },
    });
    // KPIs (previous)
    const prevRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: prevStartDate, endDate: prevEndDate, searchType },
    });

    const curRow = curRes.data.rows?.[0];
    const prevRow = prevRes.data.rows?.[0];

    const clicks = Math.round(curRow?.clicks ?? 0);
    const impressions = Math.round(curRow?.impressions ?? 0);
    const ctr = (curRow?.ctr ?? 0) * 100; // API returns 0..1
    const position = curRow?.position ?? 0;

    const clicksPrev = Math.round(prevRow?.clicks ?? 0);
    const impressionsPrev = Math.round(prevRow?.impressions ?? 0);
    const ctrPrev = (prevRow?.ctr ?? 0) * 100;
    const posPrev = prevRow?.position ?? 0;

    const seoKpis = [
      kpi('clicks', 'kpi.totalClicks', clicks, pct(clicks, clicksPrev), 'number'),
      kpi('impressions', 'kpi.totalImpressions', impressions, pct(impressions, impressionsPrev), 'number'),
      kpi('ctr', 'kpi.avgCtr', ctr, pct(ctr, ctrPrev), 'percent'),
      kpi('position', 'kpi.avgPosition', position, pctReverse(position, posPrev), 'decimal'),
    ];

    // Performance over time (date)
    const perfRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date'],
        rowLimit: 1000,
        searchType,
      },
    });
    let performance = (perfRes.data.rows || []).map((r) => ({
      date: String(r.keys?.[0] ?? ''),
      clicks: Math.round(r.clicks ?? 0),
      impressions: Math.round(r.impressions ?? 0),
    }));

    // Top queries
    const queriesRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 10,
        searchType,
      },
    });
    const topQueries = (queriesRes.data.rows || []).map((r) => ({
      query: String(r.keys?.[0] ?? ''),
      clicks: Math.round(r.clicks ?? 0),
      impressions: Math.round(r.impressions ?? 0),
      ctr: (r.ctr ?? 0) * 100,
      position: r.position ?? 0,
    }));

    // Top pages
    const pagesRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 10,
        searchType,
      },
    });
    const topPages = (pagesRes.data.rows || []).map((r) => ({
      path: toPath(String(r.keys?.[0] ?? '')),
      clicks: Math.round(r.clicks ?? 0),
      impressions: Math.round(r.impressions ?? 0),
      ctr: (r.ctr ?? 0) * 100,
      position: r.position ?? 0,
    }));

    // Cache for 5 minutes on the Edge
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    return res.status(200).json({ seoKpis, performance, topQueries, topPages });
  } catch (err: any) {
    console.error('GSC handler error:', err?.response?.data || err);
    return res.status(500).json({
      error: 'GSC request failed',
      details: err?.message || 'Unknown error',
      api: err?.response?.data || null,
    });
  }
}

function buildPeriods(range: Range) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 2); // GSC data lags ~2 days
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (days - 1));

  const prevEnd = new Date(start);
  prevEnd.setUTCDate(start.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevEnd.getUTCDate() - (days - 1));

  return {
    startDate: iso(start),
    endDate: iso(end),
    prevStartDate: iso(prevStart),
    prevEndDate: iso(prevEnd),
  };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function kpi(
  key: string,
  labelKey: string,
  value: number,
  changePct: number,
  format: 'number' | 'percent' | 'decimal'
) {
  return { key, labelKey, value, changePct, format };
}

const pct = (cur: number, prev: number) => (prev ? ((cur - prev) / prev) * 100 : 0);

// Lower position is better, so invert to show improvement as positive
const pctReverse = (cur: number, prev: number) => (prev ? ((prev - cur) / prev) * 100 : 0);

function toPath(full: string) {
  try {
    const u = new URL(full);
    return u.pathname || '/';
  } catch {
    return full;
  }
}
