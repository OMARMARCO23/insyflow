import { google } from 'googleapis';

export default async function handler(req: any, res: any) {
  try {
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!keyJson) return res.status(500).json({ error: 'Missing GOOGLE_SERVICE_ACCOUNT_KEY' });

    const sa = JSON.parse(keyJson);
    const auth = new google.auth.JWT(
      sa.client_email,
      undefined,
      String(sa.private_key || '').replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/webmasters.readonly']
    );
    const sc = google.searchconsole({ version: 'v1', auth });
    const { data } = await sc.sites.list({});
    return res.status(200).json({
      items: (data?.siteEntry || []).map(s => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel }))
    });
  } catch (e: any) {
    console.error('gsc-sites error', e);
    return res.status(500).json({ error: e?.message || 'failed' });
  }
}
