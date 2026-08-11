'use client';

import { useEffect, useMemo, useState } from 'react';

function money(value) {
  if (value == null) return 'Aguardando fonte';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function numberBr(value) {
  if (value == null) return '--';

  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
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
      .then(([weatherData, marketData]) => {
        setWeather(weatherData || { cities: [] });
        setMarket(marketData || { items: [] });
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

      setRadar({
        message: 'Não foi possível carregar o radar agora.',
      });
    } finally {
      setLoadingRadar(false);
    }
  }

  const ticker = useMemo(() => {
    const marketItems = (market.items || [])
      .map((item) => item.label + ': ' + money(item.value))
      .join(' • ');

    const weatherItems = (weather.cities || [])
      .map((city) => {
        const temp = city.current?.temperature;

        return (
          city.city +
          ': ' +
          (temp == null ? '--' : numberBr(temp)) +
          '°C'
        );
      })
      .join(' • ');

    return [marketItems, weatherItems]
      .filter(Boolean)
      .join(' • ');
  }, [market, weather]);

  const whatsappUrl =
    'https://wa.me/5527996311605?text=Ola%21%20Vi%20o%20anuncio%20da%20Tesla%20Sistemas%20de%20Irrigacao%20no%20Painel%20Agro%20ES%20e%20gostaria%20de%20mais%20informacoes.';

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

      <section className="teslaBanner">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar com a Tesla Sistemas de Irrigação pelo WhatsApp"
        >
          <img
            src="/WhatsApp Image 2026-08-10 at 22.32.53.jpeg"
            alt="Tesla Sistemas de Irrigação - A base do seu plantio começa aqui"
          />
        </a>
      </section>

      {market.source && (
        <div className="marketSource">
          <strong>Mercado físico ES</strong>

          <span>
            {market.source}
            {market.quoteDate
              ? ' • cotação ' + market.quoteDate
              : ''}
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
              {item.changePct == null
                ? ''
                : ' • ' + item.changePct + '%'}
            </small>
          </article>
        ))}
      </section>

      <div className="ticker">
        <div>{ticker || 'Carregando dados...'}</div>
      </div>

      <section className="weatherSection">
        <div className="sectionTitle">
          <div>
            <h2>🌤️ Clima no Espírito Santo</h2>
            <p>
              Temperatura atual e previsão diária das cidades selecionadas.
            </p>
          </div>
        </div>

        <div className="weatherGrid">
          {(weather.cities || []).map((city) => {
            const current = city.current || {};
            const today = city.today || {};

            return (
              <article className="weatherCard" key={city.city}>
                <div className="weatherCardTop">
                  <strong>{city.city}</strong>
                  <span>{weatherEmoji(current.weatherCode)}</span>
                </div>

                <h3>
                  {current.temperature == null
                    ? '--'
                    : numberBr(current.temperature) + '°C'}
                </h3>

                <small>
                  Mín. {numberBr(today.min)}° • Máx. {numberBr(today.max)}°
                </small>

                <small>
                  💧 Umidade {current.humidity ?? '--'}%
                </small>

                <small>
                  🌧️ Chuva {today.rainProbability ?? '--'}%
                </small>

                <small>
                  💨 Vento {numberBr(current.wind)} km/h
                </small>

                {today.rainMm != null && (
                  <small>
                    Acumulado previsto: {numberBr(today.rainMm)} mm
                  </small>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="radarSection">
        <div>
          <h2>📡 Radar Agro ES</h2>

          <p>
            Consulte informações e sinais úteis para acompanhar o campo.
          </p>
        </div>

        <button
          type="button"
          onClick={runRadar}
          disabled={loadingRadar}
        >
          {loadingRadar ? 'Consultando...' : 'Rodar Radar'}
        </button>

        {radar && (
          <div className="radarResult">
            <strong>Resultado do radar</strong>

            <pre>{JSON.stringify(radar, null, 2)}</pre>
          </div>
        )}
      </section>

      <footer>
        <span>Painel Agro ES</span>
        <span>Mercado • Clima • Inteligência</span>
      </footer>
    </main>
  );
}
