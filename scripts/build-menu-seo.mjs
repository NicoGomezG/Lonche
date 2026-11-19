// Genera los archivos de SEO de la carta a partir de src/menu.json:
//   - src/carta.html   → página estática /carta (HTML plano, legible sin JavaScript)
//   - src/llms.txt     → resumen en Markdown para asistentes de IA
//   - src/sitemap.xml  → sitemap con fecha de actualización
//   - src/index.html   → bloque JSON-LD (schema.org Restaurant + Menu) entre marcadores
//
// Uso: npm run menu
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => join(root, 'src', f);
const menu = JSON.parse(readFileSync(src('menu.json'), 'utf8'));

const SITE = 'https://lonche.cl';
const BUSINESS = {
  name: 'Lonche Foods',
  street: 'Simón Bolívar 2644',
  locality: 'Ñuñoa',
  region: 'Región Metropolitana',
  city: 'Santiago',
  phone: '+56998329194',
  phoneDisplay: '+56 9 9832 9194',
  instagram: 'https://instagram.com/lonchecl',
  whatsapp: 'https://wa.me/56998329194',
};

const H = menu.hours;
const hoursText = `${H.label}, de ${H.opens} a ${H.closes} hrs`;
const fmt = (p) => (p == null ? 'A consultar' : '$' + String(p).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sections = menu.groups.flatMap((t) => t.categories);
const prices = sections.flatMap((c) => c.items.map((i) => i.price)).filter((p) => p != null);
const priceRange = `${fmt(Math.min(...prices))} – ${fmt(Math.max(...prices))} CLP`;

// ---------- JSON-LD ----------
const menuLd = {
  '@type': 'Menu',
  '@id': `${SITE}/carta#menu`,
  name: 'Carta Lonche Foods',
  url: `${SITE}/carta`,
  inLanguage: 'es-CL',
  hasMenuSection: sections.map((c) => ({
    '@type': 'MenuSection',
    name: c.cat,
    hasMenuItem: c.items.map((i) => ({
      '@type': 'MenuItem',
      name: i.name,
      ...(i.desc ? { description: i.desc } : {}),
      ...(i.price != null
        ? { offers: { '@type': 'Offer', price: i.price, priceCurrency: 'CLP' } }
        : {}),
    })),
  })),
};

const restaurantLd = {
  '@context': 'https://schema.org',
  '@type': ['Restaurant', 'CafeOrCoffeeShop'],
  '@id': `${SITE}/#restaurant`,
  name: BUSINESS.name,
  url: `${SITE}/`,
  logo: `${SITE}/assets/logo.png`,
  image: `${SITE}/assets/logo.png`,
  description:
    'Comida casera en Ñuñoa: desayunos, brunch, sándwiches, almuerzos (menú del día), bowls de ensaladas, sopas, empanadas, cafetería y postres. Opciones vegetarianas y veganas. Para servir, pick up y delivery.',
  telephone: BUSINESS.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.street,
    addressLocality: BUSINESS.locality,
    addressRegion: BUSINESS.region,
    addressCountry: 'CL',
  },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: H.opens,
    closes: H.closes,
  }],
  servesCuisine: ['Comida casera', 'Chilena', 'Desayunos', 'Brunch', 'Cafetería'],
  priceRange,
  currenciesAccepted: 'CLP',
  sameAs: [BUSINESS.instagram],
  hasMenu: menuLd,
};

const jsonLd = JSON.stringify(restaurantLd, null, 2).replace(/</g, '\\u003c');

// ---------- index.html ----------
const START = '<!-- MENU-JSONLD:START (generado por npm run menu, no editar a mano) -->';
const END = '<!-- MENU-JSONLD:END -->';
let index = readFileSync(src('index.html'), 'utf8');
const block = `${START}\n  <script type="application/ld+json">\n${jsonLd}\n  </script>\n  ${END}`;
const re = /<!-- MENU-JSONLD:START[\s\S]*?<!-- MENU-JSONLD:END -->/;
if (!re.test(index)) throw new Error('No encontré los marcadores MENU-JSONLD en src/index.html');
index = index.replace(re, block);
writeFileSync(src('index.html'), index);

// ---------- carta.html ----------
const sectionsHtml = menu.groups
  .map(
    (t) => `
    <section aria-labelledby="t-${t.id}">
      <h2 id="t-${t.id}">${esc(t.title)}</h2>${t.categories
        .map(
          (c) => `
      <h3>${esc(c.cat)}</h3>
      <ul>${c.items
        .map(
          (i) => `
        <li><span class="n">${esc(i.name)}</span><span class="p">${fmt(i.price)}</span>${
            i.desc ? `<span class="d">${esc(i.desc)}</span>` : ''
          }</li>`
        )
        .join('')}
      </ul>`
        )
        .join('')}
    </section>`
  )
  .join('');

const carta = `<!doctype html>
<html lang="es-CL">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Carta y precios · Lonche Foods, Ñuñoa</title>
  <meta name="description" content="Carta completa de Lonche Foods con precios: desayunos, sándwiches, menú del día, bowls de ensaladas, sopas, empanadas, cafetería y postres. ${esc(BUSINESS.street)}, ${esc(BUSINESS.locality)}.">
  <link rel="canonical" href="${SITE}/carta">
  <link rel="alternate" type="application/pdf" href="${SITE}/assets/menu.pdf" title="Carta en PDF">
  <link rel="icon" type="image/png" href="/assets/logo.png">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_CL">
  <meta property="og:title" content="Carta Lonche Foods · Ñuñoa">
  <meta property="og:description" content="Desayunos, almuerzos, cafetería y postres. Precios actualizados.">
  <meta property="og:url" content="${SITE}/carta">
  <meta property="og:image" content="${SITE}/assets/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', ...menuLd, provider: { '@id': `${SITE}/#restaurant`, '@type': 'Restaurant', name: BUSINESS.name } }, null, 2).replace(/</g, '\\u003c')}
  </script>
  <style>
    :root { --green:#7aad2a; --green-dark:#4e7318; --ink:#1a1a1a; --muted:#5c5c5c; --line:#e6ddcf; --bg:#fdf8f0; }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.5 'DM Sans', system-ui, sans-serif; }
    main { max-width: 720px; margin: 0 auto; padding: 32px 16px 48px; }
    header { text-align:center; margin-bottom: 24px; }
    header img { width: 72px; height: auto; }
    h1 { font-family:'Playfair Display', Georgia, serif; font-size: 2rem; margin: 8px 0 4px; }
    .sub { color: var(--muted); margin: 0; }
    .actions { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin: 16px 0 8px; }
    .actions a { text-decoration:none; color:#fff; background:var(--green-dark); padding:8px 14px; border-radius:999px; font-weight:500; font-size:.9rem; }
    .actions a.alt { background:transparent; color:var(--green-dark); border:1.5px solid var(--green-dark); }
    .veg { display:inline-block; background:var(--green); color:#fff; font-weight:600; font-size:.85rem; padding:4px 12px; border-radius:6px; margin-top:8px; }
    h2 { font-family:'Playfair Display', Georgia, serif; font-size:1.5rem; border-bottom:3px solid var(--ink); padding-bottom:4px; margin:36px 0 8px; }
    h3 { font-size:.85rem; letter-spacing:.06em; text-transform:uppercase; color:var(--green-dark); margin:20px 0 4px; }
    ul { list-style:none; margin:0; padding:0; }
    li { display:grid; grid-template-columns:1fr auto; gap:0 12px; padding:10px 0; border-bottom:1px solid var(--line); }
    .n { font-weight:600; }
    .p { font-weight:600; white-space:nowrap; }
    .d { grid-column:1 / -1; color:var(--muted); font-size:.9rem; }
    footer { margin-top:40px; text-align:center; color:var(--muted); font-size:.9rem; }
    footer a { color:var(--green-dark); }
  </style>
</head>
<body>
  <main>
    <header>
      <a href="/"><img src="/assets/logo.png" alt="Lonche Foods" width="72" height="72"></a>
      <h1>Carta Lonche Foods</h1>
      <p class="sub">Comida casera · ${esc(BUSINESS.street)}, ${esc(BUSINESS.locality)}, ${esc(BUSINESS.city)}</p>
      <p class="sub">Horario: ${esc(hoursText)}</p>
      <span class="veg">Opciones vegetarianas y veganas</span>
      <nav class="actions" aria-label="Pedidos">
        <a href="${BUSINESS.whatsapp}?text=${encodeURIComponent('Hola! Quiero hacer un pedido 🙌')}">Pedir por WhatsApp</a>
        <a class="alt" href="/assets/menu.pdf">Carta en PDF</a>
        <a class="alt" href="/">Volver al inicio</a>
      </nav>
    </header>
${sectionsHtml}
    <footer>
      <p>Precios en pesos chilenos (CLP).</p>
      <p><strong>${BUSINESS.name}</strong> · ${esc(BUSINESS.street)}, ${esc(BUSINESS.locality)} · <a href="tel:${BUSINESS.phone}">${BUSINESS.phoneDisplay}</a> · <a href="${BUSINESS.instagram}">@lonchecl</a></p>
    </footer>
  </main>
</body>
</html>
`;
writeFileSync(src('carta.html'), carta);

// ---------- llms.txt ----------
const llms = `# ${BUSINESS.name}

> Restaurante y cafetería de comida casera en ${BUSINESS.locality}, ${BUSINESS.city}, Chile. Desayunos, brunch, sándwiches, almuerzos (menú del día), bowls de ensaladas, sopas, empanadas, cafetería y postres. Opciones vegetarianas y veganas. Para servir en el local, pick up (retiro) y delivery.

- Dirección: ${BUSINESS.street}, ${BUSINESS.locality}, ${BUSINESS.city}, Chile
- Horario: ${hoursText}
- Teléfono / WhatsApp: ${BUSINESS.phoneDisplay} (${BUSINESS.whatsapp})
- Instagram: @lonchecl (${BUSINESS.instagram})
- Sitio web: ${SITE}/
- Carta en HTML: ${SITE}/carta
- Carta en PDF: ${SITE}/assets/menu.pdf
- Pedidos: pick up por WhatsApp; delivery por Rappi
- Carta actualizada: ${menu.updated}. Precios en pesos chilenos (CLP).

## Carta
${menu.groups
  .map(
    (t) =>
      `\n### ${t.title}\n` +
      t.categories
        .map(
          (c) =>
            `\n#### ${c.cat}\n\n` +
            c.items.map((i) => `- ${i.name} — ${fmt(i.price)}${i.desc ? `: ${i.desc}` : ''}`).join('\n')
        )
        .join('\n')
  )
  .join('\n')}
`;
writeFileSync(src('llms.txt'), llms);

// ---------- sitemap.xml ----------
writeFileSync(
  src('sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${menu.updated}</lastmod></url>
  <url><loc>${SITE}/carta</loc><lastmod>${menu.updated}</lastmod></url>
  <url><loc>${SITE}/assets/menu.pdf</loc><lastmod>${menu.updated}</lastmod></url>
</urlset>
`
);

console.log(`Carta generada: ${sections.length} secciones, ${sections.reduce((n, c) => n + c.items.length, 0)} productos.`);
