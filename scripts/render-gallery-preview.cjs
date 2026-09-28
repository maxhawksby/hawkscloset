// Local render of the actual Shopify theme with a read-only catalog snapshot.
// Shopify forms/analytics are omitted. Browser tests mock cart calls.
const fs = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '..');
const theme = path.join(root, 'hawks-closet-theme');
const raw = JSON.parse(fs.readFileSync(path.join(root, '.local/drop-products.json'))).products;
const cards = JSON.parse(fs.readFileSync(path.join(root, '.local/catalog-cards.json')));
const engine = new Liquid({ root: path.join(theme, 'snippets'), extname: '.liquid' });
engine.registerFilter('asset_url', name => '/hawks-closet-theme/assets/' + name);
engine.registerFilter('stylesheet_tag', url => `<link rel="stylesheet" href="${url}">`);
engine.registerFilter('image_url', (image, width) => {
  const url = typeof image === 'string' ? image : image?.src || image?.url;
  if (!url) return '';
  const parsed = new URL(url.startsWith('//') ? 'https:' + url : url);
  if (width) parsed.searchParams.set('width', width[1]);
  return parsed.href;
});
engine.registerFilter('money', cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100));
engine.registerFilter('json', JSON.stringify);
const schema = JSON.parse(fs.readFileSync(path.join(theme, 'config/settings_schema.json')));
const settings = Object.fromEntries(schema.flatMap(group => (group.settings || []).filter(x => x.id).map(x => [x.id, x.default])));
const products = raw.map(p => {
  const data = cards.find(x => x.id === String(p.id)) || {};
  const images = p.images.map(image => ({ ...image, alt: p.title }));
  const variants = p.variants.map(v => ({ ...v, price: Math.round(Number(v.price) * 100) }));
  return { ...p, description: p.body_html, url: '/products/' + p.handle,
    available: variants.some(v => v.available), price: Math.min(...variants.map(v => v.price)),
    variants, images, featured_image: images[0], selected_or_first_available_variant: variants.find(v => v.available) || variants[0],
    metafields: { custom: Object.fromEntries(['condition', 'size', 'era', 'material'].map(k => [k, { value: data[k === 'condition' ? 'cond' : k] || '' }])) }
  };
});
const collection = { title: 'Drop 02', products: products.slice(0, 40), products_count: products.length, url: '/collections/drop-02' };
const context = { settings, collection, collections: { all: collection, 'drop-02': collection },
  paginate: { next: null }, request: { locale: { iso_code: 'en' } }, routes: { root_url: '/', collections_url: '/collections' },
  shop: { name: 'Hawks Closet', url: 'https://hawkscloset.com', description: 'Selected vintage from New Jersey.' }, page_title: 'The collection', template: 'index',
  content_for_header: '<meta name="robots" content="noindex"><script>window.Shopify={routes:{root:"/"},currency:{active:"USD"}};</script>'
};
function source(file) {
  return fs.readFileSync(path.join(theme, file), 'utf8')
    .replace(/{% schema %}[\s\S]*?{% endschema %}/g, '')
    .replace(/{% paginate [\s\S]*?%}/g, '').replace(/{% endpaginate %}/g, '');
}
(async () => {
  context.content_for_layout = await engine.parseAndRender(source('sections/main-homepage.liquid'), context);
  const html = await engine.parseAndRender(source('layout/theme.liquid'), context);
  fs.mkdirSync(path.join(root, 'preview/gallery'), { recursive: true });
  fs.writeFileSync(path.join(root, 'preview/gallery/index.html'), html);
  fs.mkdirSync(path.join(root, 'preview/gallery/products'), { recursive: true });
  const selected = products.find(p => p.available && p.images.length > 1) || products[0];
  for (const product of products) {
    const productContext = { ...context, product, template: 'product', page_title: product.title };
    productContext.content_for_layout = await engine.parseAndRender(source('sections/main-product.liquid'), productContext);
    const page = await engine.parseAndRender(source('layout/theme.liquid'), productContext);
    fs.writeFileSync(path.join(root, 'preview/gallery/products', product.handle + '.html'), page);
    if (product.id === selected.id) fs.writeFileSync(path.join(root, 'preview/gallery/product.html'), page);
  }
  console.log(`Rendered actual theme with ${collection.products.length} real product cards and ${products.length} product pages.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
