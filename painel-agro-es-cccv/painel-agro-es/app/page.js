'use client';

import { useEffect, useMemo, useState } from 'react';

function money(value) {
  if (value == null) return 'Aguardando fonte';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function weatherEmoji(code) {
  if (code == null) return '🌤️';
  if ([0, 1].includes(code)) return '☀️';
  if ([2, 3].includes(code)) return '🌤️';
  if ([45, 48].includes(code)) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

export default function Home() {
  const [weather, setWeather] = useState({ cities: [] });
  const [market, setMarket] = useState({ items: [] });
  const [radar, setRadar] = useState(null);
  const [loadingRadar, setLoadingRadar] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/weather').then((r) => r.json()),
      fetch('/api/market').then((r) => r.json()),
    ])
      .then(([w, m]) => {
        setWeather(w);
        setMarket(m);
      })
      .catch((error) => {
        console.error('Erro ao carregar dados:', error);
      });
  }, []);

  async function runRadar() {
    try {
      setLoadingRadar(true);

      const response = await fetch('/api/radar');
      const data = await response.json();

      setRadar(data);
    } catch (error) {
      console.error('Erro no radar:', error);
    } finally {
      setLoadingRadar(false);
    }
  }

  const ticker = useMemo(() => {
    const marketItems = (market.items || [])
      .map((item) => ${item.label}: ${money(item.value)})
      .join(' • ');

    const weatherItems = (weather.cities || [])
      .map((city) => ${city.name}: ${city.temperature ?? '--'}°C)
      .join(' • ');

    return [marketItems, weatherItems].filter(Boolean).join(' • ');
  }, [market, weather]);

  return (
    <main>
      <header>
        <div>
          <small>MERCADO • CLIMA • INTELIGÊNCIA</small>
          <h1>Painel Agro ES</h1>
          <p>
            Informação prática para quem produz e negocia no Espírito Santo.
          </p>
        </div>

        <span className="live">● ONLINE</span>
      </header>

      <section className="ad adTop teslaAd">
        <div className="teslaAdContent">
          <strong>TESLA SISTEMAS DE IRRIGAÇÃO</strong>
          <span>A base do seu plantio começa aqui!</span>
          <small>
            Soluções em irrigação para levar eficiência e produtividade
            ao campo.
          </small>
        </div>

        <a
          href="https://wa.me/5527996311605?text=Ol%C3%A1%2C%20vim%20pelo%20Painel%20Agro%20ES%20e%20gostaria%20de%20saber%20mais%20sobre%20os%20sistemas%20de%20irriga%C3%A7%C3%A3o."
          target="_blank"
          rel="noopener noreferrer"
        >
          Falar no WhatsApp
        </a>
      </section>

      {market.source && (
        <div className="marketSource">
          <strong>Mercado físico ES</strong>

          <span>
            {market.source}
            {market.quoteDate ? ` • cotação ${market.quoteDate}` : ''}
          </span>
        </div>
      )}

      <section className="prices">
        {(market.items || []).map((item) => (
          <article className="priceCard" key={item.id}>
            <span>
              {item.id === 'boi' ? '🐂' : '☕'} {item.label}
            </span>

            <strong>{money(item.value)}</strong>

            <small>
              {item.unit} • {item.source}
              {item.changePct == null ? '' : ` • ${item.changePct}%`}
            </small>
          </article>
        ))}
      </section>

      <div className="ticker">
        <div>{ticker || 'Carregando dados...'}</div>
      </div>

      <section>
        <div className="sectionTitle">
          <div>
            <h2>🌦️ Clima no Espírito Santo</h2>
            <p>Atualização automática das cidades selecionadas.</p>
          </div>
        </div>

        <div className="weatherGrid">
          {(weather.cities || []).map((city) => (
            <article className="weatherCard" key={city.name}>
              <div>
                <strong>{city.name}</strong>
                <span>{weatherEmoji(city.weatherCode)}</span>
              </div>

              <h3>{city.temperature ?? '--'}°C</h3>

              <small>
                Umidade: {city.humidity ?? '--'}%
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="radarSection">
        <div className="sectionTitle">
          <div>
            <h2>📡 Radar Agro</h2>
            <p>Informações para apoiar decisões no campo.</p>
          </div>

          <button onClick={runRadar} disabled={loadingRadar}>
            {loadingRadar ? 'Analisando...' : 'Atualizar radar'}
          </button>
        </div>

        {radar && (
          <div className="radarResult">
            <pre>{JSON.stringify(radar, null, 2)}</pre>
          </div>
        )}
      </section>

      <footer>
        <strong>Painel Agro ES</strong>
        <span>Mercado • Clima • Inteligência</span>
      </footer>
    </main>
  );
}
