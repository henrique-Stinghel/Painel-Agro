import { listAds } from '../../../lib/db';

const fallbackTesla = {
  id: 'tesla-original',
  company_name: 'Tesla Sistemas de Irrigação',
  call_to_action: 'A base do seu plantio começa aqui',
  image_url: '/WhatsApp Image 2026-08-10 at 22.32.53.jpeg',
  target_url: 'https://wa.me/5527996311605?text=Ola%21%20Vi%20o%20anuncio%20da%20Tesla%20Sistemas%20de%20Irrigacao%20no%20Painel%20Agro%20ES%20e%20gostaria%20de%20mais%20informacoes.',
  position: 'topo',
  active: true
};

export async function GET() {
  try {
    const items = await listAds({ activeOnly: true });
    return Response.json({ items: items.length ? items : [fallbackTesla] });
  } catch {
    return Response.json({ items: [fallbackTesla], fallback: true });
  }
}
