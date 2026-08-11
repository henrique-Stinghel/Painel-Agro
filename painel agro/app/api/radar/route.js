import OpenAI from 'openai';
import { getMarketSnapshot } from '../../../lib/market';

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'Configure OPENAI_API_KEY no servidor.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const market = await getMarketSnapshot();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6',
    instructions: `Você é o Radar IA do Painel Agro ES. Gere uma análise curta e prudente para Arábica, Conilon e boi gordo. Trabalhe com cenários, não certezas. Não dê recomendação de compra ou venda. Quando faltarem dados de mercado reais, diga claramente que não há base suficiente para prever preço. Responda em português brasileiro.`,
    input: JSON.stringify({
      market,
      weather: body.weather || null,
      extraSignals: body.extraSignals || null
    })
  });

  return Response.json({
    analysis: response.output_text,
    generatedAt: new Date().toISOString(),
    disclaimer: 'Análise probabilística e informativa; não constitui recomendação financeira ou comercial.'
  });
}
