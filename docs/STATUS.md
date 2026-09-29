# Status

## Pick up here (saved 2026-09-28)
Gallery rebuild is built locally in `gallery-theme/` (a new theme; `hawks-closet-theme/` still mirrors the live shop). Source of truth: [BRIEF.md](BRIEF.md). Launch plan: [LAUNCH.md](LAUNCH.md).

- Preview: `npm run gallery`, then http://localhost:4181/ (placeholder tee on every piece, simulated cart, no Shopify writes). Screenshots and demo videos: `docs/previews/gallery/`.
- Tests: `node tests/gallery-theme-browser.cjs` with the preview running (45 checks: desktop, phone, reduced motion). `npm run gallery:check` runs Theme Check (clean).
- Catalog: all 175 products are sold and sit in the Archive smart collection (37 Drop 02 pieces were set from 1 to 0 on 2026-09-28; undo record `docs/archive/drop02-sold-out-2026-09-28.csv`). Store is still password-protected.
- Milestones: 1-3 built; 4 built except the Shopify preview upload (needs Max's OK); 5 is launch day.

Next, in order:
1. Max reviews the look (direction check) and gives one feedback list.
2. Max loads 15-20 new pieces (flat lays) and schedules them for Oct 16 noon (see LAUNCH.md).
3. With Max's OK: upload `gallery-theme/` as an unpublished Shopify theme; Max clicks through; verify the launch-screen clock on Shopify.

Tooling: headless Chromium needs `libasound.so.2`. `apt-get download libasound2t64 && dpkg-deb -x libasound2t64*.deb asound`, then run tests with `LD_LIBRARY_PATH=<dir>/asound/usr/lib/x86_64-linux-gnu` (or `sudo apt install libasound2t64`).

## Latest: cart update published and verified
The approved animation → checkout-sidebar flow is live on theme `150280110158`. Exactly five files changed; all other theme files and the password page are byte-identical to the pre-release download. Live desktop/mobile test carts passed and were cleaned up. See [CART-RELEASE.md](CART-RELEASE.md). Tonight’s work is complete. Next session: a feature/UX audit of the actual site, not a UI redesign. Older unpublished notes below are historical.

## Current scope: original UI plus basket animation only
- Maxwell rejected the gallery redesign and canceled further gallery/copy work for now.
- Original storefront restored from the verified published recovery bundle in `.local/shopify-snapshots/password-release-recovery/`. Both password files preserved and confirmed byte-identical to that release.
- Five theme files differ: `assets/script.js`, `sections/main-product.liquid`, `layout/theme.liquid`, and new `assets/cart-flight.js` / `assets/cart-flight.css`. The cart now opens immediately after animation over the retained item screen; the extra homepage transition and 350ms delay are removed. Escape dismisses the cart first, returning to the same item.
- Animation wraps the add-to-cart callback. Product UI, filters, search, password page, and checkout destination are preserved; only the cart handoff and necessary stacking/close behavior changed.
- Focused browser checks passed on desktop, mobile, and reduced motion, including both product views, checkout-button reachability, retaining the item underneath the sidebar, closing back to that item, duplicate-click protection, and no animation on a failed request.
- Local preview: http://localhost:4180/. Animation-only patch is not published; prior local-review-before-Shopify instruction remains in force.
- Rejected local theme archived at `.local/shopify-snapshots/before-animation-only-local.tar.gz`.
- A fresh Shopify pull timed out in automatic permission review. No remote read/write occurred in this turn; the verified published recovery bundle was used instead. Refresh live files and compare these five paths before any later approved upload.

Earlier notes below are historical and are superseded by this scope.

## Latest: motionless password screen published
The original live shop has been restored and verified against its backup. Only the password template and stylesheet differ. The chrome clock is replaced by motionless dimensional numbers. See [PASSWORD-RELEASE.md](PASSWORD-RELEASE.md) for publication evidence and backups. Earlier clock notes below describe the previous release.

Current task board: [TASKS.md](TASKS.md).

## Delivered: password page
- Shopify CLI connected to `ri5pxg-pg.myshopify.com`.
- Live theme: `drop02 Final`, ID `150280110158`.
- Maxwell approved preview, verification, and password-page publication.
- Uploaded an unpublished preview, ID `153699647566`, checked the Shopify-rendered page, then published only the seven password-page files.
- Fresh-browser verification passed at https://hawkscloset.com/password: 3D clock, active September 26, 2026 noon New York (EDT) countdown, loaded artwork, no mobile overflow. Password protection remains enabled.
- Existing photo background and SMS signup preserved. Background reduced from 3.4 MB to 188 KB; clock WebP is 57 KB.
- SMS validation/retry/confirmation behavior tested with mocked responses. No real test subscriptions sent; message delivery remains unverified.
- Original live-theme snapshot: `.local/shopify-snapshots/live-150280110158-20260915.tar.gz`.

## Current checkpoint: local gallery review
- All storefront source changes are in `hawks-closet-theme/`. The old `hawks-closet/` prototype is untouched.
- Cream gallery design, refined type, softer controls, product captions, and product-image-to-cart animation are implemented locally.
- Cart response handling improved to avoid false success and false sold-out states. Removed eager loading of every gallery image.
- Read 175 real catalog products; current local preview uses the Drop 02 snapshot (40 grid cards, 77 product pages).
- Run `npm run preview`; local gallery URL is http://localhost:4180/ (prints a fallback port if occupied).
- One bounded smoke check passed against the local server: add to cart, visible product animation, remove from cart, and mobile width.
- Preview uses a simulated cart and checkout handoff. It never writes to Shopify or places an order. Collection navigation/sorting are not fully simulated.
- Gallery code has **not** been uploaded or published. Maxwell explicitly wants local review first.
- Theme Check passed with zero errors before the preview-server handoff. Full gallery regression work is not complete; do not report it as passed.
- A bounded read-only agent audit identified the missing manual cart simulator (addressed) and unbounded asset waits in the larger test suite (queued for the regression checkpoint).

## Next
Pause further design work until Maxwell reviews the local theme. Take one consolidated feedback list, make the agreed revision, then complete bounded regression checks. Upload or publish the gallery only with the corresponding approval.

Separate queued milestones: product-description drafts, then catalog updates; the actual September 26 password-removal workflow. No automatic unlock has been scheduled. The countdown alone does not unlock Shopify.

## Development state
The repository was synchronized from the newer live theme before editing. Much of the Git diff reflects that synchronization rather than newly authored gallery changes. Changes remain uncommitted; no Git push was performed.

## Artwork provenance
Generated with the built-in imagegen tool. Prompt: Original photoreal CGI hero for Hawks Closet; a single sculptural retro digital desk countdown clock with polished rounded chrome housing, entirely blank black glass display for HTML countdown digits, subtle feet, front-facing with a slight view of top and right; centered with negative space on a dark charcoal studio background and tabletop, soft contact shadow and broad rim lighting; landscape 3:2, clock about 80 percent of width; no props, people, logos, watermark, text, or graphic UI.

Final edit prompt (built-in imagegen): Remove the studio background and tabletop, leaving only the clock housing, black display, and feet on genuine transparency. Preserve front-facing shape, chrome, blank opaque black glass, lighting, and proportions. Crop tightly with a small transparent margin; no text, digits, or new objects. Generated at 1947x808, encoded to a 1536x637 WebP with alpha for the website.
