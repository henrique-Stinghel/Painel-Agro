const FEEDS = {
  climate: 'https://news.google.com/rss/search?q=clima+tempo+Esp%C3%ADrito+Santo+agricultura&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  coffee: 'https://news.google.com/rss/search?q=mercado+caf%C3%A9+Brasil+cota%C3%A7%C3%A3o+safra&hl=pt-BR&gl=BR&ceid=BR:pt-419',
};

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .trim();
}

function field(item, tag) {
  return decodeXml(item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]);
}

function parseFeed(xml, category) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 6).map((match, index) => {
    const item = match[1];
    const fullTitle = field(item, 'title');
    const parts = fullTitle.split(' - ');
    const source = parts.length > 1 ? parts.pop() : field(item, 'source') || 'Notícias';
    return {
      id: `${category}-${index}-${field(item, 'guid') || field(item, 'link')}`,
      category,
      title: parts.join(' - ') || fullTitle,
      source,
      url: field(item, 'link'),
      publishedAt: field(item, 'pubDate'),
    };
  }).filter((item) => item.title && item.url);
}

async function loadFeed(category, url) {
  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'Painel Agro ES/1.0' },
  });
  if (!response.ok) throw new Error(`Feed ${category} indisponível`);
  return parseFeed(await response.text(), category);
}

export async function GET() {
  const results = await Promise.allSettled(Object.entries(FEEDS).map(([category, url]) => loadFeed(category, url)));
  const items = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  return Response.json({ items, updatedAt: new Date().toISOString() });
}
