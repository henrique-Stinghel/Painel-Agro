'use client';

import { useEffect, useMemo, useState } from 'react';

function money(value) {
  if (value == null) return 'Aguardando fonte';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function weatherEmoji(code) {
  if (code == null) return '🌤️';
  if ([0, 1].includes(code)) return '☀️';
  if ([2, 3].includes(code)) return '⛅';
  if ([45, 48].includes(code)) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

export default function Home() {
  const [weather, setWeather] = useState({ cities: [] });
  const [market, setMarket] = useState({ items: [] });
  const [radar, setRadar] = useState('O Radar IA será liberado quando houver dados de mercado suficientes.');
  const [loadingRadar, setLoadingRadar] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/weather').then((r) => r.json()),
      fetch('/api/market').then((r) => r.json())
    ]).then(([w, m]) => {
      setWeather(w);
      setMarket(m);
    });
  }, []);

  const ticker = useMemo(() => {
    const prices = market.items.map((item) => `${item.label}: ${money(item.value)}`);
    const climates = weather.cities.slice(0, 4).map((c) => `${c.city}: ${c.current.temperature ?? '--'}°C`);
    return [...prices, ...climates].join(' • ');
  }, [market, weather]);

  async function runRadar() {
    setLoadingRadar(true);
    try {
      const res = await fetch('/api/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather })
      });
      const data = await res.json();
      setRadar(data.analysis || data.error || 'Não foi possível gerar a análise.');
    } finally {
      setLoadingRadar(false);
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Mercado • Clima • Inteligência</p>
          <h1>Painel Agro ES</h1>
          <p className="sub">Informação prática para quem produz e negocia no Espírito Santo.</p>
        </div>
        <span className="live">● ONLINE</span>
      </header>

      <section className="ad adTop">
        <div>
          <strong>ESPAÇO PUBLICITÁRIO PREMIUM</strong>
          <span>Banner principal para cooperativas, lojas, máquinas, irrigação, insumos e serviços.</span>
        </div>
        <button>Quero anunciar</button>
      </section>

      {market.source && (
        <div className="marketSource">
          <strong>Mercado físico ES</strong>
          <span>{market.source}{market.quoteDate ? ` · cotação ${market.quoteDate}` : ''}</span>
        </div>
      )}

      <section className="prices">
        {market.items.map((item) => (
          <article className="priceCard" key={item.id}>
            <span>{item.id === 'boi' ? '🐂' : '☕'} {item.label}</span>
            <strong>{money(item.value)}</strong>
            <small>{item.unit} · {item.source}{item.changePct == null ? '' : ` · ${item.changePct}%`}</small>
          </article>
        ))}
      </section>

      <div className="ticker"><div>{ticker || 'Carregando dados…'} • {ticker}</div></div>

      <section className="section">
        <div className="sectionTitle">
          <div><h2>🌦️ Clima no Espírito Santo</h2><p>Atualização automática das cidades selecionadas.</p></div>
        </div>
        <div className="weatherGrid">
          {weather.cities.map((c) => (
            <article className="weatherCard" key={c.city}>
              <div className="weatherTop"><strong>{c.city}</strong><span>{weatherEmoji(c.current.weatherCode)}</span></div>
              <div className="temp">{c.current.temperature ?? '--'}°C</div>
              <p>Hoje: {c.today.min ?? '--'}° / {c.today.max ?? '--'}°</p>
              <p>Chuva: {c.today.rainProbability ?? '--'}% · {c.today.rainMm ?? '--'} mm</p>
              <p>Umidade: {c.current.humidity ?? '--'}% · Vento: {c.current.wind ?? '--'} km/h</p>
            </article>
          ))}
        </div>
      </section>

      <section className="radar section">
        <div className="sectionTitle">
          <div><h2>🤖 Radar IA diário</h2><p>Análise de cenários, nunca promessa de preço.</p></div>
          <button onClick={runRadar} disabled={loadingRadar}>{loadingRadar ? 'Analisando…' : 'Gerar análise'}</button>
        </div>
        <div className="radarText">{radar}</div>
        <small>Análise informativa e probabilística. Não constitui recomendação de compra, venda ou investimento.</small>
      </section>

      <section className="ad adMid"><strong>PUBLICIDADE</strong><span>Segundo espaço comercial do portal.</span></section>

      <footer>
        <strong>Painel Agro ES</strong>
        <span>As fontes e horários de cada dado devem ser exibidos na versão de produção.</span>
      </footer>
    </main>
  );
}
