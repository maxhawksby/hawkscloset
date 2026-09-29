"""Local-only theme review server. Cart operations are simulated in memory.

Default: the live theme (hawks-closet-theme). With --gallery: the gallery rebuild (gallery-theme).
"""
import json
import sys
import mimetypes
import uuid
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = json.loads((ROOT / '.local/catalog-products.json').read_text())['products']
VARIANTS = {str(v['id']): (p, v) for p in PRODUCTS for v in p['variants']}
CARTS = {}
GALLERY = '--gallery' in sys.argv
PLACEHOLDER = '/gallery-theme/assets/piece-placeholder.webp'


class Preview(BaseHTTPRequestHandler):
    def session(self):
        cookie = cookies.SimpleCookie(self.headers.get('Cookie', ''))
        sid = cookie['hawks_preview'].value if 'hawks_preview' in cookie else str(uuid.uuid4())
        return sid, CARTS.setdefault(sid, {})

    def reply(self, body, status=200, content_type='application/json', sid=None):
        if not isinstance(body, bytes):
            body = json.dumps(body).encode() if content_type == 'application/json' else body.encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        if sid:
            self.send_header('Set-Cookie', f'hawks_preview={sid}; Path=/; HttpOnly; SameSite=Lax')
        self.end_headers()
        self.wfile.write(body)

    def cart(self, items):
        return {'items': list(items.values()), 'item_count': len(items),
                'total_price': sum(x['final_line_price'] for x in items.values())}

    def do_GET(self):
        url = urlparse(self.path)
        sid, items = self.session()
        if url.path == '/cart.js':
            return self.reply(self.cart(items), sid=sid)
        if url.path == '/search/suggest.json':
            q = parse_qs(url.query).get('q', [''])[0].lower()
            matches = [p for p in PRODUCTS if q in p['title'].lower()][:10]
            return self.reply({'resources': {'results': {'products': [
                {'title': p['title'], 'url': '/products/' + p['handle'],
                 'available': any(v['available'] for v in p['variants']),
                 'price': p['variants'][0]['price'],
                 'image': p['images'][0]['src'] if p['images'] else ''} for p in matches]}}}, sid=sid)
        if url.path == '/checkout':
            return self.reply('<!doctype html><title>Local checkout preview</title><main style="max-width:560px;margin:15vh auto;padding:24px;font:18px/1.6 Arial;color:#121314;background:#fff"><h1>Checkout preview</h1><p>This is the local theme preview. Your test cart is saved here; no order or payment has been created.</p><a href="/">Back to the collection</a></main>', content_type='text/html', sid=sid)
        route = url.path
        if GALLERY:
            return self.gallery(route, sid)
        if route == '/' or route.startswith('/collections/'):
            route = '/preview/gallery/index.html'
        elif route.startswith('/products/'):
            route = '/preview/gallery/products/' + route.rsplit('/', 1)[-1] + '.html'
        elif route.endswith('/'):
            route += 'index.html'
        # Serve only preview pages and theme assets, never credentials or repo metadata.
        if not route.startswith(('/preview/', '/hawks-closet-theme/assets/')):
            return self.reply({'error': 'Not available in the local preview'}, 404)
        path = (ROOT / route.lstrip('/')).resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            return self.reply({'error': 'Preview file not found'}, 404)
        return self.reply(path.read_bytes(), content_type=mimetypes.guess_type(path.name)[0] or 'application/octet-stream', sid=sid)

    def gallery(self, route, sid):
        pages = ROOT / 'preview/gallery-theme'
        if route.startswith('/gallery-theme/assets/'):
            path = (ROOT / route.lstrip('/')).resolve()
        elif route in ('/', ''):
            path = pages / 'index.html'
        elif route.startswith(('/collections/', '/products/', '/pages/')):
            path = (pages / (route.strip('/') + '.html')).resolve()
        else:
            path = (pages / (route.strip('/') + '.html')).resolve()
        allowed = (ROOT / 'gallery-theme/assets', pages)
        if not any(path.is_relative_to(base) for base in allowed) or not path.is_file():
            body = (pages / '404.html').read_bytes() if (pages / '404.html').is_file() else b'Not found'
            return self.reply(body, 404, 'text/html', sid=sid)
        return self.reply(path.read_bytes(), content_type=mimetypes.guess_type(path.name)[0] or 'application/octet-stream', sid=sid)

    def do_POST(self):
        sid, items = self.session()
        try:
            data = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
        except (ValueError, TypeError):
            return self.reply({'description': 'Invalid preview request'}, 400)
        if self.path == '/cart/add.js':
            key = str(data.get('id'))
            if key not in VARIANTS:
                return self.reply({'description': 'Piece not found'}, 404)
            product, variant = VARIANTS[key]
            if not variant['available'] or key in items:
                return self.reply({'description': 'This piece is unavailable or already in your cart.'}, 422, sid=sid)
            cents = round(float(variant['price']) * 100)
            image = PLACEHOLDER if GALLERY else (product['images'][0]['src'] if product['images'] else '')
            items[key] = {'id': variant['id'], 'variant_id': variant['id'], 'key': key, 'title': product['title'],
                          'product_title': product['title'], 'url': '/products/' + product['handle'],
                          'variant_title': variant['title'], 'image': image,
                          'quantity': 1, 'final_price': cents, 'final_line_price': cents}
            return self.reply(items[key], sid=sid)
        if self.path == '/cart/change.js':
            items.pop(str(data.get('id')), None)
            return self.reply(self.cart(items), sid=sid)
        return self.reply({'description': 'Not available in the local preview'}, 404)


if __name__ == '__main__':
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 4181 if GALLERY else 4180), Preview)
    except OSError as error:
        if error.errno != 98:
            raise
        server = ThreadingHTTPServer(('127.0.0.1', 0), Preview)
    label = 'Gallery rebuild' if GALLERY else 'Live theme'
    print(f'{label} preview: http://localhost:{server.server_port}/ (simulated cart, no Shopify writes)', flush=True)
    server.serve_forever()
