# Hawks Closet

Current release: original storefront UI with product-to-basket animation and direct checkout sidebar, published and verified on Shopify. See [release evidence](docs/CART-RELEASE.md). The cream gallery redesign has been reverted. Password-page work is preserved. See [docs/TASKS.md](docs/TASKS.md).

Shopify storefront for [hawkscloset.com](https://hawkscloset.com), store `ri5pxg-pg.myshopify.com`.

- `hawks-closet-theme/` is the Shopify theme. It was synchronized from live theme `drop02 Final` (`150280110158`) on September 15, 2026 before the password-page changes.
- `hawks-closet/` is an older static prototype, not the deployed storefront.
- `docs/STATUS.md` records current delivery and verification status.

## Gallery rebuild

`gallery-theme/` is the new gallery storefront theme (see [docs/BRIEF.md](docs/BRIEF.md) and [docs/LAUNCH.md](docs/LAUNCH.md)). It is not uploaded to Shopify yet.

```sh
npm run gallery          # render and serve on http://localhost:4181/
npm run gallery:check    # Shopify Theme Check
node tests/gallery-theme-browser.cjs   # end-to-end checks, preview must be running
```

Preview-only pages: `/launch` (launch screen), `/password`, `/collections/states-upcoming`, `/collections/states-empty`.

## Local work

The installed Shopify CLI is authenticated to Maxwell's account. Credentials stay in Shopify CLI's user configuration and are not included in this repository.

```sh
npm run theme:list
npm run theme:check
npm test
npm run preview
```

Open **http://localhost:4180/** for the gallery and **http://localhost:4180/preview/** for the password page. `npm run preview` renders the real theme templates using the previously downloaded catalog snapshot, then starts a local server. If port 4180 is occupied, it prints a fallback URL.

The local gallery supports browsing, product details, a simulated cart, the add-to-cart animation, and a checkout preview. It does not write to Shopify or place orders. Other collection navigation and sorting are not fully simulated. The password preview blocks SMS submissions.

The catalog snapshot and storefront credentials remain in ignored `.local/`; they are never served by the preview server. The current project task list is [docs/TASKS.md](docs/TASKS.md).

`npm run theme:dev` uploads a development theme to Shopify and starts Shopify's preview server. Use only within authorized Shopify preview work. It does not publish the live theme.

## Drop date and unlock

Theme settings > Password Page > Next drop date and time controls the timer. The confirmed date is `2026-09-26T12:00:00-04:00`, September 26, 2026 at noon in New York (EDT).

The countdown does **not** remove Shopify password protection. An actual unlock needs a separately verified Shopify setting or launch workflow. No automatic unlock has been configured.

## Publication

The motionless dimensional password screen is published and verified. Only its template and stylesheet differ from the original live shop. See [release verification](docs/PASSWORD-RELEASE.md). Gallery changes remain local and require review and separate release approval. The password-page patch consists of:

- `templates/password.liquid`
- `config/settings_schema.json`
- `assets/password.css`
- `assets/password-signup.js`
- `assets/drop-countdown.js`
- `assets/password-background.webp`

Review a Shopify preview first, then push only these files to the verified live theme, preserving current store settings and unrelated changes. The local repository also contains the live-theme synchronization and separate theme-check fixes, which are not part of this password-page-only release.

The original live theme backup is `.local/shopify-snapshots/live-150280110158-20260915.tar.gz` (ignored by Git).

Artwork source and prompt provenance are in `output/imagegen/` and `docs/STATUS.md`. The older chrome clock artwork is retained locally but is no longer used by the password page.
