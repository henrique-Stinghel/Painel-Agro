# Painel Agro ES

Starter funcional em Next.js para:

- banner publicitário premium;
- Arábica, Conilon e boi gordo via adaptador de mercado;
- clima do ES via Open-Meteo;
- Radar IA via OpenAI Responses API;
- layout responsivo e ticker.

## Rodar localmente

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra http://localhost:3000.

## IA

Coloque `OPENAI_API_KEY` apenas em `.env.local` ou no painel de variáveis do provedor de hospedagem. Nunca exponha a chave no frontend.

## Clima

O projeto usa o endpoint público do Open-Meteo apenas como base de protótipo. Para um portal monetizado/comercial, configure o endpoint e a chave do plano/licença comercial.

## Cotações

`lib/market.js` é propositalmente um adaptador vazio. Conecte ali um provedor/licença que autorize exibição/redistribuição pública dos preços de Arábica, Conilon e boi gordo.
