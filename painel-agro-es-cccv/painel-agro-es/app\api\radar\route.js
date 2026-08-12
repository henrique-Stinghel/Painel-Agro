import OpenAI from 'openai';
import { getMarketSnapshot } from '../../../lib/market';

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: 'Configure OPENAI_API_KEY no servidor.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({ model: process.env.OPENAI_MODEL || 'gpt-5.6', instructions: 'Você é o Radar IA do Painel Agro ES. Gere análise curta, prudente e em português brasileiro. Trabalhe com cenários, não certezas. Não dê recomendação de compra ou venda.', input: JSON.stringify({ market: await getMarketSnapshot(), weather: body.weather || null }) });
  return Response.json({ analysis: response.output_text, generatedAt: new Date().toISOString(), disclaimer: 'Análise informativa; não constitui recomendação financeira ou comercial.' });
}
