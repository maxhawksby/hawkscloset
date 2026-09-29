// Local render of gallery-theme/ with the read-only catalog snapshot (.local/catalog-products.json).
// Every piece shows the placeholder tee until real flat lays are loaded into Shopify.
// Output: preview/gallery-theme/. Served by `python3 scripts/preview-server.py --gallery`.
const fs = require('node:fs');
const path = require('node:path');
const { Liquid, Tag, Hash } = require('liquidjs');

const root = path.resolve(__dirname, '..');
const theme = path.join(root, 'gallery-theme');
const out = path.join(root, 'preview/gallery-theme');
const PLACEHOLDER = '/gallery-theme/assets/piece-placeholder.webp';
const snapshot = JSON.parse(fs.readFileSync(path.join(root, '.local/catalog-products.json'))).products;

const engine = new Liquid({ root: path.join(theme, 'snippets'), extname: '.liquid', dynamicPartials: true, strictFilters: true });
engine.registerFilter('asset_url', name => '/gallery-theme/assets/' + name);
engine.registerFilter('image_url', (image) => {
  const url = typeof image === 'string' ? image : image && (image.src || image.url);
  return url || '';
});
const money = cents => {
  const n = Number(cents) / 100;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
};
engine.registerFilter('money_without_trailing_zeros', money);
engine.registerFilter('money', money);
engine.registerFilter('pluralize', (count, one, many) => Number(count) === 1 ? one : many);
engine.registerFilter('video_tag', () => '');
engine.registerFilter('preload_tag', url => `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin="anonymous">`);
// Shopify block tags the preview stands in for.
engine.registerTag('form', class extends Tag {
  constructor(token, remainTokens, liquid) {
    super(token, remainTokens, liquid);
    this.templates = [];
    const stream = this.liquid.parser.parseStream(remainTokens)
      .on('tag:endform', () => stream.stop())
      .on('template', tpl => this.templates.push(tpl))
      .on('end', () => { throw new Error('form tag not closed'); });
    stream.start();
  }
  * render(ctx, emitter) {
    emitter.write('<form action="#" method="post" onsubmit="event.preventDefault()">');
    yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
    emitter.write('</form>');
  }
});
engine.registerTag('paginate', class extends Tag {
  constructor(token, remainTokens, liquid) {
    super(token, remainTokens, liquid);
    this.templates = [];
    const stream = this.liquid.parser.parseStream(remainTokens)
      .on('tag:endpaginate', () => stream.stop())
      .on('template', tpl => this.templates.push(tpl))
      .on('end', () => { throw new Error('paginate tag not closed'); });
    stream.start();
  }
  * render(ctx, emitter) {
    ctx.push({ paginate: { next: null } });
    yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
    ctx.pop();
  }
});

const schema = JSON.parse(fs.readFileSync(path.join(theme, 'config/settings_schema.json')));
const settings = Object.fromEntries(schema.flatMap(g => (g.settings || []).filter(s => s.id).map(s => [s.id, s.default ?? ''])));

const placeholderImage = { src: PLACEHOLDER, alt: '' };
const products = snapshot.map(p => {
  const variants = p.variants.map(v => ({ ...v, price: Math.round(Number(v.price) * 100) }));
  const image = { ...placeholderImage, alt: p.title };
  const available = variants.some(v => v.available);
  return {
    id: p.id, title: p.title, handle: p.handle, url: '/products/' + p.handle, object_type: 'product',
    tags: p.tags, created_at: p.created_at, description: p.body_html, available,
    price: Math.min(...variants.map(v => v.price)), variants,
    selected_or_first_available_variant: variants.find(v => v.available) || variants[0],
    featured_image: image, images: [image]
  };
});
const byTag = tag => products.filter(p => p.tags.includes(tag));
const collection = (handle, title, items) => ({ handle, title, url: '/collections/' + handle, products: items, products_count: items.length });
const collections = {
  all: collection('all', 'All pieces', products),
  'drop-02': collection('drop-02', 'Drop 02', byTag('drop-02')),
  archive: collection('archive', 'Archive', products.filter(p => !p.available).sort((a, b) => b.created_at.localeCompare(a.created_at)))
};
// Preview-only state boards, so every state can be seen without touching Shopify.
const upcomingDemo = byTag('drop-02').filter(p => p.available).slice(0, 3).map((p, i) => i === 0 ? { ...p, tags: [...p.tags, settings.upcoming_tag] } : p);
collections['states-upcoming'] = collection('states-upcoming', 'Preview: coming soon', [...upcomingDemo, ...collections.archive.products.slice(0, 1)]);
collections['states-empty'] = collection('states-empty', 'Preview: empty wall', []);

const base = {
  settings, collections, cart: { item_count: 0 },
  shop: { name: 'Hawks Closet' }, request: { locale: { iso_code: 'en' } },
  routes: { root_url: '/', search_url: '/search', cart_url: '/cart', collections_url: '/collections', cart_add_url: '/cart/add' },
  content_for_header: '<meta name="robots" content="noindex">'
};

function source(file) {
  return fs.readFileSync(path.join(theme, file), 'utf8').replace(/{% schema %}[\s\S]*?{% endschema %}/g, '');
}
function templateSections(name) {
  const raw = fs.readFileSync(path.join(theme, 'templates', name + '.json'), 'utf8').replace(/^\/\*[\s\S]*?\*\//, '');
  const json = JSON.parse(raw);
  return json.order.map(id => ({ id, ...json.sections[id] }));
}
async function renderPage(templateName, extra, file, overrides = {}) {
  const ctx = { ...base, ...extra, template: { name: templateName.split('.')[0], suffix: templateName.split('.')[1] || null } };
  let content = '';
  for (const section of templateSections(templateName)) {
    const sectionSettings = { ...section.settings, ...(overrides[section.id] || {}) };
    if (sectionSettings.collection) sectionSettings.collection = collections[sectionSettings.collection];
    content += await engine.parseAndRender(source('sections/' + section.type + '.liquid'), { ...ctx, section: { id: section.id, settings: sectionSettings } }, { globals: ctx });
  }
  let html = await engine.parseAndRender(source('layout/theme.liquid'), { ...ctx, content_for_layout: content }, { globals: ctx });
  if (extra.previewSearch) html = html.replace('</head>', '<script>window.__PREVIEW_SEARCH = true;</script></head>');
  write(file, html);
}
function write(file, html) {
  const target = path.join(out, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
}

(async () => {
  fs.rmSync(out, { recursive: true, force: true });
  // The home wall shows Drop 02 in the preview; in Shopify it is the section's collection setting.
  const homeWall = { main: { collection: 'drop-02' } };
  await renderPage('index', { page_title: '' }, 'index.html', homeWall);
  for (const [handle, c] of Object.entries(collections)) {
    await renderPage('collection', { collection: c, page_title: c.title }, `collections/${handle}.html`);
  }
  for (const product of products) {
    await renderPage('product', { product, page_title: product.title }, `products/${product.handle}.html`);
  }
  const upcoming = upcomingDemo[0];
  await renderPage('product', { product: upcoming, page_title: upcoming.title }, 'products/states-upcoming.html');
  await renderPage('search', { search: { terms: '', results: products, results_count: products.length }, previewSearch: true, page_title: 'Search' }, 'search.html');
  await renderPage('page.about', { page: { handle: 'about', title: 'About' }, page_title: 'About' }, 'pages/about.html');
  await renderPage('404', { page_title: 'Not found' }, '404.html');
  await renderPage('cart', { page_title: 'Cart' }, 'cart.html');
  // Launch gate on, launch time in the future: every page is the launch screen.
  const gateSettings = { ...settings, launch_gate: true, next_drop_at: settings.next_drop_at };
  await renderPage('index', { settings: gateSettings, page_title: '' }, 'launch.html', homeWall);
  const password = await engine.parseAndRender(source('templates/password.liquid').replace('{% layout none %}', ''), base, { globals: base });
  write('password.html', password.replace('<head>', '<head><script>window.fetch = async function () { throw new Error("Local preview: submissions are disabled."); };</script>'));
  console.log(`Rendered gallery theme: ${products.length} pieces, ${Object.keys(collections).length} collections -> preview/gallery-theme/`);
})().catch(error => { console.error(error); process.exitCode = 1; });
