'use client';

import { useEffect, useMemo, useState } from 'react';

const money = (value) => value == null ? 'Aguardando fonte' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const numberBr = (value) => value == null ? '--' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
function weatherEmoji(code) { if (code == null) return '🌤️'; if ([0, 1].includes(code)) return '☀️'; if ([2, 3].includes(code)) return '🌤️'; if ([45, 48].includes(code)) return '🌫️'; if (code >= 51 && code <= 67) return '🌧️'; if (code >= 80 && code <= 82) return '🌦️'; if (code >= 95) return '⛈️'; return '🌤️'; }

function AdSlot({ ads, position }) {
  const items = ads.filter((ad) => ad.position === position);
  if (!items.length) return null;
  return <section className={`adSlot adSlot-${position}`} aria-label="Publicidade">{items.map((ad) => <a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" key={ad.id} aria-label={`${ad.company_name}: ${ad.call_to_action}`}><img src={ad.image_url} alt={`${ad.company_name} - ${ad.call_to_action}`} /><span><strong>{ad.company_name}</strong>{ad.call_to_action}</span></a>)}</section>;
}

function ChangeBadge({ value }) {
  if (value == null) return null;
  const state = value > 0 ? 'up' : value < 0 ? 'down' : 'stable';
  return <span className={`changeBadge ${state}`}>{value > 0 ? '↑' : value < 0 ? '↓' : '•'} {value > 0 ? '+' : ''}{numberBr(value)}%</span>;
}

export default function Home() {
  const [weather, setWeather] = useState({ cities: [] });
  const [market, setMarket] = useState({ items: [] });
  const [ads, setAds] = useState([]);
  const [radar, setRadar] = useState(null);
  const [loadingRadar, setLoadingRadar] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/api/weather').then((r) => r.json()), fetch('/api/market').then((r) => r.json()), fetch('/api/ads').then((r) => r.json())])
      .then(([weatherData, marketData, adsData]) => { setWeather(weatherData || { cities: [] }); setMarket(marketData || { items: [] }); setAds(adsData?.items || []); })
      .catch((error) => console.error('Erro ao carregar dados:', error));
  }, []);

  async function runRadar() {
    try { setLoadingRadar(true); const response = await fetch('/api/radar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weather }) }); const data = await response.json(); setRadar(data); }
    catch { setRadar({ error: 'Não foi possível carregar o radar agora.' }); }
    finally { setLoadingRadar(false); }
  }

  const ticker = useMemo(() => [(market.items || []).map((item) => `${item.label}: ${money(item.value)}`).join(' • '), (weather.cities || []).map((city) => `${city.city}: ${numberBr(city.current?.temperature)}°C`).join(' • ')].filter(Boolean).join(' • '), [market, weather]);

  return <main>
    <header><div><small>MERCADO • CLIMA • INTELIGÊNCIA</small><h1>Painel Agro ES</h1><p>Informação prática para quem produz e negocia no Espírito Santo.</p></div><span className="live">● ONLINE</span></header>
    <AdSlot ads={ads} position="topo" />
    {market.source && <div className="marketSource"><strong>Mercado físico ES</strong><span>{market.source}{market.quoteDate ? ` • cotação ${market.quoteDate}` : ''}</span></div>}
    <section className="prices">{(market.items || []).map((item) => <article className="priceCard" key={item.id}><span>{item.id === 'boi' ? '🐂' : '☕'} {item.label}</span><strong>{money(item.value)}</strong><ChangeBadge value={item.changePct} /><small>{item.unit} • {item.source}</small></article>)}</section>
    <div className="ticker"><div>{ticker || 'Carregando dados...'}</div></div>
    <AdSlot ads={ads} position="entre-cotacoes-clima" />
    <section className="weatherSection"><div className="sectionTitle"><div><h2>🌤️ Clima no Espírito Santo</h2><p>Temperatura atual e previsão diária das cidades selecionadas.</p></div></div><div className="weatherGrid">{(weather.cities || []).map((city) => { const current = city.current || {}; const today = city.today || {}; return <article className="weatherCard" key={city.city}><div className="weatherCardTop"><strong>{city.city}</strong><span>{weatherEmoji(current.weatherCode)}</span></div><h3>{numberBr(current.temperature)}°C</h3><small>Mín. {numberBr(today.min)}° • Máx. {numberBr(today.max)}°</small><small>💧 Umidade {current.humidity ?? '--'}%</small><small>🌧️ Chuva {today.rainProbability ?? '--'}%</small><small>💨 Vento {numberBr(current.wind)} km/h</small>{today.rainMm != null && <small>Acumulado previsto: {numberBr(today.rainMm)} mm</small>}</article>; })}</div></section>
    <AdSlot ads={ads} position="antes-radar" />
    <section className="radarSection"><div><h2>📡 Radar Agro ES</h2><p>Consulte informações e sinais úteis para acompanhar o campo.</p></div><button type="button" onClick={runRadar} disabled={loadingRadar}>{loadingRadar ? 'Consultando...' : 'Rodar Radar'}</button>{radar && <div className="radarResult"><strong>Resultado do radar</strong><p>{radar.analysis || radar.error}</p>{radar.disclaimer && <small>{radar.disclaimer}</small>}</div>}</section>
    <footer><span>Painel Agro ES</span><span>Mercado • Clima • Inteligência</span></footer>
  </main>;
}
