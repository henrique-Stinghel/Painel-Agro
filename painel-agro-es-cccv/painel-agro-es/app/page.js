'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const money = (value) => value == null ? 'Aguardando fonte' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const numberBr = (value) => value == null ? '--' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
const newsDate = (value) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)) : '';
function weatherEmoji(code) { if (code == null) return 'ðŸŒ¤ï¸'; if ([0, 1].includes(code)) return 'â˜€ï¸'; if ([2, 3].includes(code)) return 'ðŸŒ¤ï¸'; if ([45, 48].includes(code)) return 'ðŸŒ«ï¸'; if (code >= 51 && code <= 67) return 'ðŸŒ§ï¸'; if (code >= 80 && code <= 82) return 'ðŸŒ¦ï¸'; if (code >= 95) return 'â›ˆï¸'; return 'ðŸŒ¤ï¸'; }

function AdSlot({ ads, position }) {
  const items = useMemo(() => ads.filter((ad) => ad.position === position), [ads, position]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    if (items.length <= 1) return undefined;
    const rotation = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % items.length);
    }, 8000);
    return () => window.clearInterval(rotation);
  }, [items]);

  if (!items.length) return null;
  const ad = items[currentIndex] || items[0];
  return <section className={`adSlot adSlot-${position}`} aria-label="Publicidade" aria-live="polite">
    <a className="rotatingAd" href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" key={ad.id} aria-label={`${ad.company_name}: ${ad.call_to_action}`}>
      <img src={ad.image_url} alt={`${ad.company_name} - ${ad.call_to_action}`} />
      <span><strong>{ad.company_name}</strong>{ad.call_to_action}</span>
    </a>
    {items.length > 1 && <div className="adDots" aria-label={`AnÃºncio ${currentIndex + 1} de ${items.length}`}>
      {items.map((item, index) => <i className={index === currentIndex ? 'active' : ''} key={item.id} />)}
    </div>}
  </section>;
}

function ChangeBadge({ value }) {
  if (value == null) return null;
  const state = value > 0 ? 'up' : value < 0 ? 'down' : 'stable';
  return <span className={`changeBadge ${state}`}>{value > 0 ? 'â†‘' : value < 0 ? 'â†“' : 'â€¢'} {value > 0 ? '+' : ''}{numberBr(value)}%</span>;
}

function B3CoffeeQuote() {
  const widgetRef = useRef(null);

  useEffect(() => {
    const container = widgetRef.current;
    if (!container) return;
    container.replaceChildren();
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
    script.async = true;
    script.textContent = JSON.stringify({ symbol: 'BMFBOVESPA:ICF1!', width: '100%', locale: 'br', colorTheme: 'light', isTransparent: true });
    container.append(widget, script);
    return () => container.replaceChildren();
  }, []);

  return <section className="b3Market" aria-labelledby="b3-coffee-title">
    <div className="b3MarketHead">
      <div><small>MERCADO FUTURO</small><h2 id="b3-coffee-title">CafÃ© ArÃ¡bica na B3</h2></div>
      <span>B3 â€¢ atraso de 15 min</span>
    </div>
    <div className="b3Widget tradingview-widget-container" ref={widgetRef}><span>Carregando cotaÃ§Ã£o B3...</span></div>
    <p>Contrato contÃ­nuo ICF â€¢ preÃ§o futuro em dÃ³lar por saca de 60 kg. Acompanhe a direÃ§Ã£o do mercado sem substituir a cotaÃ§Ã£o fÃ­sica do EspÃ­rito Santo.</p>
  </section>;
}

function NewsColumn({ title, icon, items }) {
  return <section className="newsColumn"><h3>{icon} {title}</h3>{items.length ? items.map((item) => <a className="newsCard" href={item.url} target="_blank" rel="noopener noreferrer" key={item.id}><span>{item.source}{item.publishedAt ? ` â€¢ ${newsDate(item.publishedAt)}` : ''}</span><strong>{item.title}</strong><small>Ler notÃ­cia â†’</small></a>) : <p className="newsEmpty">Buscando as notÃ­cias mais recentes...</p>}</section>;
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
    catch { setRadar({ error: 'NÃ£o foi possÃ­vel carregar o radar agora.' }); }
    finally { setLoadingRadar(false); }
  }

  const ticker = useMemo(() => [(market.items || []).map((item) => `${item.label}: ${money(item.value)}`).join(' â€¢ '), (weather.cities || []).map((city) => `${city.city}: ${numberBr(city.current?.temperature)}Â°C`).join(' â€¢ ')].filter(Boolean).join(' â€¢ '), [market, weather]);

  return <main>
    <header><div><small>MERCADO â€¢ CLIMA â€¢ INTELIGÃŠNCIA</small><h1>Painel Agro ES</h1><p>InformaÃ§Ã£o prÃ¡tica para quem produz e negocia no EspÃ­rito Santo.</p></div><span className="live">â— ONLINE</span></header>
    <AdSlot ads={ads} position="topo" />
    {market.source && <div className="marketSource"><strong>Mercado fÃ­sico ES</strong><span>{market.source}{market.quoteDate ? ` â€¢ cotaÃ§Ã£o ${market.quoteDate}` : ''}</span></div>}
    <section className="prices">{(market.items || []).map((item) => <article className="priceCard" key={item.id}><span>{item.id === 'boi' ? 'ðŸ‚' : 'â˜•'} {item.label}</span><strong>{money(item.value)}</strong><ChangeBadge value={item.changePct} /><small>{item.unit} â€¢ {item.source}</small></article>)}</section>
    <B3CoffeeQuote />
    <div className="ticker"><div>{ticker || 'Carregando dados...'}</div></div>
    <AdSlot ads={ads} position="entre-cotacoes-clima" />
    <section className="weatherSection"><div className="sectionTitle"><div><h2>ðŸŒ¤ï¸ Clima no EspÃ­rito Santo</h2><p>Temperatura atual e previsÃ£o diÃ¡ria das cidades selecionadas.</p></div></div><div className="weatherGrid">{(weather.cities || []).map((city) => { const current = city.current || {}; const today = city.today || {}; return <article className="weatherCard" key={city.city}><div className="weatherCardTop"><strong>{city.city}</strong><span>{weatherEmoji(current.weatherCode)}</span></div><h3>{numberBr(current.temperature)}Â°C</h3><small>MÃ­n. {numberBr(today.min)}Â° â€¢ MÃ¡x. {numberBr(today.max)}Â°</small><small>ðŸ’§ Umidade {current.humidity ?? '--'}%</small><small>ðŸŒ§ï¸ Chuva {today.rainProbability ?? '--'}%</small><small>ðŸ’¨ Vento {numberBr(current.wind)} km/h</small>{today.rainMm != null && <small>Acumulado previsto: {numberBr(today.rainMm)} mm</small>}</article>; })}</div></section>
    <section className="newsSection"><div className="sectionTitle"><div><h2>ðŸ“° NotÃ­cias do Agro</h2><p>AtualizaÃ§Ãµes diÃ¡rias de clima e do mercado cafeeiro.</p></div></div><div className="newsGrid"><NewsColumn title="Clima no ES" icon="ðŸŒ¦ï¸" items={news.filter((item) => item.category === 'climate')} /><NewsColumn title="Mercado do CafÃ©" icon="â˜•" items={news.filter((item) => item.category === 'coffee')} /></div></section>
    <AdSlot ads={ads} position="antes-radar" />
    <section className="radarSection"><div><h2>ðŸ“¡ Radar Agro ES</h2><p>Consulte informaÃ§Ãµes e sinais Ãºteis para acompanhar o campo.</p></div><button type="button" onClick={runRadar} disabled={loadingRadar}>{loadingRadar ? 'Consultando...' : 'Rodar Radar'}</button>{radar && <div className="radarResult"><strong>Resultado do radar</strong><p>{radar.analysis || radar.error}</p>{radar.disclaimer && <small>{radar.disclaimer}</small>}</div>}</section>
    <footer><span>Painel Agro ES</span><span>Mercado â€¢ Clima â€¢ InteligÃªncia</span></footer>
  </main>;
}

