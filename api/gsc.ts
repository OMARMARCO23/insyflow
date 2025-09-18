import { google } from 'googleapis';

type Range = '7d' | '30d' | '90d';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const siteUrl = process.env.GSC_SITE_URL;
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!siteUrl || !keyJson) {
      res.status(500).json({ error: 'Missing GSC_SITE_URL or GOOGLE_SERVICE_ACCOUNT_KEY' });
      return;
    }

    const sa = JSON.parse(keyJson);
    const privateKey = String(sa.private_key || '').replace(/\\n/g, '\n');
    const clientEmail = sa.client_email as string;

    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ['https://www.googleapis.com/auth/webmasters.readonly']
    );
    const sc = google.searchconsole({ version: 'v1', auth });

    const range = (req.query.range as Range) || '30d';
    const { startDate, endDate, prevStartDate, prevEndDate } = buildPeriods(range);

    // KPIs current
    const cur = await sc.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate }
    });
    // KPIs previous
    const prev = await sc.searchanalytics.query({
      siteUrl,
      requestBody: { startDate: prevStartDate, endDate: prevEndDate }
    });

    const curRow = cur.data.rows?.[0];
    const prevRow = prev.data.rows?.[0];

    const clicks = Math.round(curRow?.clicks || 0);
    const impressions = Math.round(curRow?.impressions || 0);
    // API returns ctr as 0..1
    const ctr = ((curRow?.ctr || 0) * 100);
    const position = curRow?.position || 0;

    const clicksPrev = Math.round(prevRow?.clicks || 0);
    const impressionsPrev = Math.round(prevRow?.impressions || 0);
    const ctrPrev = ((prevRow?.ctr || 0) * 100);
    const posPrev = prevRow?.position || 0;

    const seoKpis = [
      kpi('clicks', 'kpi.totalClicks', clicks, pct(clicks, clicksPrev), 'number'),
      kpi('impressions', 'kpi.totalImpressions', impressions, pct(impressions, impressionsPrev), 'number'),
      kpi('ctr', 'kpi.avgCtr', ctr, pct(ctr, ctrPrev), 'percent'),
      kpi('position', 'kpi.avgPosition', position, pctReverse(position, posPrev), 'decimal'),
    ];

    // Performance over time (date dimension)
    const perf = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate, endDate,
        dimensions: ['date'],
        rowLimit: 1000
      }
    });
    const performance = (perf.data.rows || []).map(r => ({
      date: (r.keys?.[0] as string) || '',
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0)
    }));

    // Top queries
    const queriesRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate, endDate,
        dimensions: ['query'],
        rowLimit: 10
      }
    });
    const topQueries = (queriesRes.data.rows || []).map(r => ({
      query: String(r.keys?.[0] || ''),
      clicks: Math.round(r.clicks || 0),
      impressions: Math.round(r.impressions || 0),
      ctr: ((r.ctr || 0) * 100),
      position: r.position || 0
    }));

    // Top pages
    const pagesRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate, endDate,
        dimensions: ['page'],
        rowLimit: 10
      }
    });
    const topPages = (pagesRes.data.rows || []).map(r => {
      const full = String(r.keys?.[0] || '');
      const path = toPath(full);
      return {
        path,
        clicks: Math.round(r.clicks || 0),
        impressions: Math.round(r.impressions || 0),
        ctr: ((r.ctr || 0) * 100),
        position: r.position || 0
      };
    });

    res.status(200).json({ seoKpis, performance, topQueries, topPages });
  } catch (err: any) {
    console.error('GSC error:', err);
    res.status(500).json({ error: 'GSC request failed', details: err?.message });
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
    startDate: toISO(start),
    endDate: toISO(end),
    prevStartDate: toISO(prevStart),
    prevEndDate: toISO(prevEnd),
  };
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function kpi(key: string, labelKey: string, value: number, changePct: number, format: 'number' | 'percent' | 'decimal') {
  return { key, labelKey, value, changePct, format };
}

function pct(cur: number, prev: number) {
  if (!prev) return 0;
  return ((cur - prev) / prev) * 100;
}

// Lower position is better, so invert positive/negative
function pctReverse(cur: number, prev: number) {
  if (!prev) return 0;
  return ((prev - cur) / prev) * 100;
}

function toPath(full: string) {
  try {
    const u = new URL(full);
    return u.pathname || '/';
  } catch {
    return full;
  }
}