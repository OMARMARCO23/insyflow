import { BetaAnalyticsDataClient } from '@google-analytics/data';

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
    const propertyId = process.env.GA4_PROPERTY_ID;
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!propertyId || !keyJson) return res.status(500).json({ error: 'Missing env' });

    const sa = JSON.parse(keyJson);
    const analytics = new BetaAnalyticsDataClient({
      credentials: { client_email: sa.client_email, private_key: String(sa.private_key || '').replace(/\\n/g, '\n') },
    });

    const [rt] = await analytics.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }, { name: 'eventCount' }],
    });

    const m = rt?.totals?.[0]?.metricValues || [];
    const activeUsers = Number(m[0]?.value || 0);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20');
    res.status(200).json({ activeUsers });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'realtime failed' });
  }
}
