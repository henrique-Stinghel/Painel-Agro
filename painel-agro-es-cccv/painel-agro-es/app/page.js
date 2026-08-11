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

function getCityName(city) {
  return (
    city.name ||
    city.city ||
    city.nome ||
    city.location ||
    'Cidade'
  );
}

function getTemperature(city) {
  return (
    city.temperature ??
    city.temp ??
    city.currentTemperature ??
    city.current_temperature ??
    city.temperature_2m ??
    '--'
  );
}

function getHumidity(city) {
  return (
    city.humidity ??
    city.umidade ??
    city.relativeHumidity ??
    city.relative_humidity_2m ??
    null
  );
}

function getMinTemp(city) {
  return (
    city.min ??
    city.minTemp ??
    city.minTemperature ??
    city.temperatureMin ??
    city.temperature_2m_min ??
    null
  );
}

function getMaxTemp(city) {
  return (
    city.max ??
    city.maxTemp ??
    city.maxTemperature ??
    city.temperatureMax ??
    city.temperature_2m_max ??
    null
  );
}

function getRain(city) {
  return (
    city.rain ??
    city.precipitation ??
    city.precipitacao ??
    city.precipitation_sum ??
    null
  );
}

function getWeatherCode(city) {
  return (
    city.weatherCode ??
    city.weather_code ??
    city.code ??
    city.weathercode ??
    null
  );
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
        const name = getCityName(city);
        const temp = getTemperature(city);

        return name + ': ' + temp + '°C';
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
            <p>Atualização automática das cidades selecionadas.</p>
          </div>
        </div>

        <div className="weatherGrid">
          {(weather.cities || []).map((city, index) => {
            const cityName = getCityName(city);
            const temperature = getTemperature(city);
            const humidity = getHumidity(city);
            const minTemp = getMinTemp(city);
            const maxTemp = getMaxTemp(city);
            const rain = getRain(city);
            const weatherCode = getWeatherCode(city);

            return (
              <article
                className="weatherCard"
                key={cityName + '-' + index}
              >
                <div className="weatherCardTop">
                  <strong>{cityName}</strong>
                  <span>{weatherEmoji(weatherCode)}</span>
                </div>

                <h3>
                  {temperature === '--'
                    ? '--'
                    : temperature + '°C'}
                </h3>

                {minTemp != null && maxTemp != null ? (
                  <small>
                    Hoje: {minTemp}° / {maxTemp}°
                  </small>
                ) : humidity != null ? (
                  <small>
                    Umidade: {humidity}%
                  </small>
                ) : (
                  <small>Dados meteorológicos</small>
                )}

                {rain != null && (
                  <small>
                    Chuva: {rain} mm
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
