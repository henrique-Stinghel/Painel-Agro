'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const money = (value) => value == null ? 'Aguardando fonte' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const numberBr = (value) => value == null ? '--' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
const newsDate = (value) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)) : '';
function weatherEmoji(code) { if (code == null) return '🌤️'; if ([0, 1].includes(code)) return '☀️'; if ([2, 3].includes(code)) return '🌤️'; if ([45, 48].includes(code)) return '🌫️'; if (code >= 51 && code <= 67) return '🌧️'; if (code >= 80 && code <= 82) return '🌦️'; if (code >= 95) return '⛈️'; return '🌤️'; }

function AdSlot({ ads, position }) {
  const items = useMemo(() => ads.filter((ad) => ad.position === position), [ads, position]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    if (items.length <= 1) return undefined;
    const rotation = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(rotation);
  }, [items]);

  if (!items.length) return null;
  const ad = items[currentIndex] || items[0];
  return <section className={`adSlot adSlot-${position}`} aria-label="Publicidade" aria-live="polite">
    <a className="rotatingAd" href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" key={ad.id} aria-label={`${ad.company_name}: ${ad.call_to_action}`}>
      <img src={ad.image_url} alt={`${ad.company_name} - ${ad.call_to_action}`} />
      <span><strong>{ad.company_name}</strong>{ad.call_to_action}</span>
    </a>
    {items.length > 1 && <div className="adDots" aria-label={`Anúncio ${currentIndex + 1} de ${items.length}`}>
      {items.map((item, index) => <i className={index === currentIndex ? 'active' : ''} key={item.id} />)}
    </div>}
  </section>;
}

function ChangeBadge({ value }) {
  if (value == null) return null;
  const state = value > 0 ? 'up' : value < 0 ? 'down' : 'stable';
  return <span className={`changeBadge ${state}`}>{value > 0 ? '↑' : value < 0 ? '↓' : '•'} {value > 0 ? '+' : ''}{numberBr(value)}%</span>;
}

function MarketWidget({ title, subtitle, symbol, note }) {
  const widgetRef = useRef(null);

  useEffect(() => {
    const container = widgetRef.current;
    if (!container) return;
    container.replaceChildren();
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.async = true;
    script.textContent = JSON.stringify({
      symbols: [[title, symbol + '|1D']],
      chartOnly: false,
      width: '100%',
      height: '220',
      locale: 'br',
      colorTheme: 'light',
      autosize: false,
      showVolume: false,
      showMA: false,
      hideDateRanges: true,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: 'Arial, sans-serif',
      fontSize: '11',
      noTimeScale: false,
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      chartType: 'area',
      lineWidth: 2,
      lineType: 0,
      dateRanges: ['1d|1']
    });
    container.append(widget, script);
    return () => container.replaceChildren();
  }, [symbol, title]);

  return <article className="b3QuoteCard">
    <div className="b3QuoteTitle"><strong>{title}</strong><span>{subtitle}</span></div>
    <div className="b3Widget tradingview-widget-container" ref={widgetRef}><span>Carregando cotação...</span></div>
    <small>{note}</small>
  </article>;
}

function B3CoffeeQuote() {
  return <section className="b3Market" aria-labelledby="b3-coffee-title">
    <div className="b3MarketHead">
      <div><small>MERCADO FUTURO</small><h2 id="b3-coffee-title">Café na B3 em reais</h2></div>
      <span>B3 • atraso de 15 min</span>
    </div>
    <div className="b3QuoteGrid">
      <MarketWidget title="Conilon B3" subtitle="Cotação oficial em R$/saca" symbol="BMFBOVESPA:CNL1!" note="Contrato contínuo CNL • reais por saca de 60 kg." />
      <MarketWidget title="Arábica B3 em R$" subtitle="Conversão estimada" symbol="BMFBOVESPA:ICF1!*FX_IDC:USDBRL" note="ICF em dólar convertido pelo USD/BRL do mercado. Valor indicativo." />
    </div>
    <p>Os contratos futuros mostram a direção da bolsa e não substituem as cotações físicas da CCCV e do Incaper.</p>
  </section>;
}
function NewsColumn({ title, icon, items }) {
  return <section className="newsColumn"><h3>{icon} {title}</h3>{items.length ? items.map((item) => <a className="newsCard" href={item.url} target="_blank" rel="noopener noreferrer" key={item.id}><span>{item.source}{item.publishedAt ? ` • ${newsDate(item.publishedAt)}` : ''}</span><strong>{item.title}</strong><small>Ler notícia →</small></a>) : <p className="newsEmpty">Buscando as notícias mais recentes...</p>}</section>;
}

export default function Home() {
  const [weather, setWeather] = useState({ cities: [] });
  const [market, setMarket] = useState({ items: [] });
  const [ads, setAds] = useState([]);
  const [news, setNews] = useState([]);
  const [radar, setRadar] = useState(null);
  const [loadingRadar, setLoadingRadar] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/api/weather').then((r) => r.json()), fetch('/api/market').then((r) => r.json()), fetch('/api/ads').then((r) => r.json()), fetch('/api/news').then((r) => r.json())])
      .then(([weatherData, marketData, adsData, newsData]) => { setWeather(weatherData || { cities: [] }); setMarket(marketData || { items: [] }); setAds(adsData?.items || []); setNews(newsData?.items || []); })
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
    <B3CoffeeQuote />
    <div className="ticker"><div>{ticker || 'Carregando dados...'}</div></div>
    <AdSlot ads={ads} position="entre-cotacoes-clima" />
    <section className="weatherSection"><div className="sectionTitle"><div><h2>🌤️ Clima no Espírito Santo</h2><p>Temperatura atual e previsão diária das cidades selecionadas.</p></div></div><div className="weatherGrid">{(weather.cities || []).map((city) => { const current = city.current || {}; const today = city.today || {}; return <article className="weatherCard" key={city.city}><div className="weatherCardTop"><strong>{city.city}</strong><span>{weatherEmoji(current.weatherCode)}</span></div><h3>{numberBr(current.temperature)}°C</h3><small>Mín. {numberBr(today.min)}° • Máx. {numberBr(today.max)}°</small><small>💧 Umidade {current.humidity ?? '--'}%</small><small>🌧️ Chuva {today.rainProbability ?? '--'}%</small><small>💨 Vento {numberBr(current.wind)} km/h</small>{today.rainMm != null && <small>Acumulado previsto: {numberBr(today.rainMm)} mm</small>}</article>; })}</div></section>
    <section className="newsSection"><div className="sectionTitle"><div><h2>📰 Notícias do Agro</h2><p>Atualizações diárias de clima e do mercado cafeeiro.</p></div></div><div className="newsGrid"><NewsColumn title="Clima no ES" icon="🌦️" items={news.filter((item) => item.category === 'climate')} /><NewsColumn title="Mercado do Café" icon="☕" items={news.filter((item) => item.category === 'coffee')} /></div></section>
    <AdSlot ads={ads} position="antes-radar" />
    <section className="radarSection"><div><h2>📡 Radar Agro ES</h2><p>Consulte informações e sinais úteis para acompanhar o campo.</p></div><button type="button" onClick={runRadar} disabled={loadingRadar}>{loadingRadar ? 'Consultando...' : 'Rodar Radar'}</button>{radar && <div className="radarResult"><strong>Resultado do radar</strong><p>{radar.analysis || radar.error}</p>{radar.disclaimer && <small>{radar.disclaimer}</small>}</div>}</section>
    <footer><span>Painel Agro ES</span><span>Mercado • Clima • Inteligência</span></footer>
  </main>;
}
