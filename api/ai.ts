import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
    return;
  }

  try {
    const { type, payload } = req.body || {};
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = buildPrompt(type, payload);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ text });
  } catch (err: any) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
}

function buildPrompt(type: string, payload: any): string {
  const baseInstruction = `
You are insy-ai, a concise analytics assistant. Use ONLY the provided JSON data.
If data is insufficient, say so briefly. Be accurate and actionable. 
Prefer short sentences and bullet points when listing.
`;

  if (type === 'ask') {
    const { question, website, dashboardData, language } = payload;
    return `${baseInstruction}
Language: ${language || 'en'}
Website: ${website}
Available dashboard data (JSON):
${JSON.stringify(dashboardData, null, 2)}

User question:
"${question}"

Answer directly with a short, data-backed response.`;
  }

  if (type === 'insights') {
    const { website, dashboardData, language } = payload;
    return `${baseInstruction}
Language: ${language || 'en'}
Website: ${website}
Dashboard data (JSON):
${JSON.stringify(dashboardData, null, 2)}

Task: Provide 3-4 concise, actionable insights as bullet points.`;
  }

  if (type === 'seoInsights') {
    const { website, seoData, language } = payload;
    return `${baseInstruction}
Language: ${language || 'en'}
Website: ${website}
SEO data (JSON):
${JSON.stringify(seoData, null, 2)}

Task: Provide 3-4 concise SEO recommendations as bullet points.`;
  }

  return baseInstruction + '\nUnexpected request.';
}
