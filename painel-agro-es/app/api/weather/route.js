import { ES_CITIES } from '../../../lib/cities';

const forecastBase = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com';
const geocodingBase = process.env.OPEN_METEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com';
const apiKey = process.env.OPEN_METEO_API_KEY || '';

async function geocode(name) {
  const url = new URL('/v1/search', geocodingBase);
  url.searchParams.set('name', `${name}, Espírito Santo, Brasil`);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'pt');
  url.searchParams.set('format', 'json');
  if (apiKey) url.searchParams.set('apikey', apiKey);

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Falha ao localizar ${name}`);
  const data = await res.json();
  const place = data.results?.[0];
  if (!place) throw new Error(`Cidade não encontrada: ${name}`);
  return { latitude: place.latitude, longitude: place.longitude };
}

async function forecast(name) {
  const { latitude, longitude } = await geocode(name);
  const url = new URL('/v1/forecast', forecastBase);
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  url.searchParams.set('timezone', 'America/Sao_Paulo');
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum');
  url.searchParams.set('forecast_days', '3');
  if (apiKey) url.searchParams.set('apikey', apiKey);

  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Falha na previsão para ${name}`);
  const data = await res.json();
  return {
    city: name,
    current: {
      temperature: data.current?.temperature_2m,
      humidity: data.current?.relative_humidity_2m,
      wind: data.current?.wind_speed_10m,
      weatherCode: data.current?.weather_code,
      time: data.current?.time
    },
    today: {
      max: data.daily?.temperature_2m_max?.[0],
      min: data.daily?.temperature_2m_min?.[0],
      rainProbability: data.daily?.precipitation_probability_max?.[0],
      rainMm: data.daily?.precipitation_sum?.[0]
    }
  };
}

export async function GET() {
  const settled = await Promise.allSettled(ES_CITIES.map(forecast));
  const cities = settled
    .filter((item) => item.status === 'fulfilled')
    .map((item) => item.value);
  const errors = settled
    .filter((item) => item.status === 'rejected')
    .map((item) => item.reason?.message || 'Erro desconhecido');

  return Response.json({ updatedAt: new Date().toISOString(), cities, errors });
}
