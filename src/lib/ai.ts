import { GoogleGenerativeAI } from '@google/genai';

const USE_SERVER = String(import.meta.env.VITE_USE_SERVER_AI || 'false') === 'true';
const CLIENT_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

function ensureClient(): GoogleGenerativeAI {
  if (!CLIENT_KEY) throw new Error('Missing VITE_GEMINI_API_KEY');
  return new GoogleGenerativeAI({ apiKey: CLIENT_KEY });
}

export async function askAiClientSide(params: {
  question: string;
  website: string;
  language: string;
  dashboardData: any;
}): Promise<string> {
  const client = ensureClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are insy-ai, a concise analytics assistant. Use ONLY the provided JSON data.
If data is insufficient, say so briefly. Be accurate and actionable.

Language: ${params.language}
Website: ${params.website}

Dashboard data (JSON):
${JSON.stringify(params.dashboardData, null, 2)}

Question:
"${params.question}"

Answer directly with a short, data-backed response.`;
  const res = await model.generateContent(prompt);
  return res.response.text();
}

export async function insightsClientSide(params: {
  website: string;
  language: string;
  dashboardData: any;
}): Promise<string> {
  const client = ensureClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `
You are insy-ai, a concise analytics assistant. Provide 3-4 actionable insights as bullet points.

Language: ${params.language}
Website: ${params.website}

Dashboard data (JSON):
${JSON.stringify(params.dashboardData, null, 2)}
`;
  const res = await model.generateContent(prompt);
  return res.response.text();
}

export async function seoInsightsClientSide(params: {
  website: string;
  language: string;
  seoData: any;
}): Promise<string> {
  const client = ensureClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `
You are insy-ai, a concise analytics assistant. Provide 3-4 SEO-focused recommendations as bullet points.

Language: ${params.language}
Website: ${params.website}

SEO data (JSON):
${JSON.stringify(params.seoData, null, 2)}
`;
  const res = await model.generateContent(prompt);
  return res.response.text();
}

async function postServer(type: string, payload: any): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload }),
  });
  if (!res.ok) throw new Error('AI server error');
  const data = await res.json();
  return data.text ?? '';
}

export async function askAi(payload: {
  question: string;
  website: string;
  language: string;
  dashboardData: any;
}): Promise<string> {
  if (USE_SERVER) return postServer('ask', payload);
  return askAiClientSide(payload);
}

export async function generateDashboardInsights(payload: {
  website: string;
  language: string;
  dashboardData: any;
}): Promise<string[]> {
  const text = USE_SERVER ? await postServer('insights', payload) : await insightsClientSide(payload);
  return splitBullets(text);
}

export async function generateSeoInsights(payload: {
  website: string;
  language: string;
  seoData: any;
}): Promise<string[]> {
  const text = USE_SERVER ? await postServer('seoInsights', payload) : await seoInsightsClientSide(payload);
  return splitBullets(text);
}

function splitBullets(markdown: string): string[] {
  const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);
  const items = lines
    .filter(l => l.startsWith('- ') || l.startsWith('* ') || l.match(/^\d+\.\s/))
    .map(l => l.replace(/^(-|\*|\d+\.)\s*/, '').trim());
  return items.length ? items : [markdown.trim()];
}