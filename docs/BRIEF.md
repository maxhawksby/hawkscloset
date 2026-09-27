# Hawks Closet - gallery storefront rebuild

## What & why
Hawks Closet sells one-of-one vintage graphic tees ($350-850), each with a year, a title and a history. That makes every shirt closer to an artwork than a product, and the site should treat it that way: buying a $60 tee should feel like buying a $100,000 painting. The store is moving from occasional locked drops to an always-open gallery where new pieces are announced and added over time, so it has to hold up 24/7. This is a fresh Shopify theme, built to Awwwards-level craft, that keeps the navigation Max already likes: easy search, easy size selection, and seeing at a glance what is available.

## References and what we take from each
- **yeezy.com** - the grid and how shirts float: small objects in a lot of white space, all pieces at the same visual scale, almost no text.
- **justinreed.com** - resale clarity: every card shows item, size and price, with quick add to cart and strong collection navigation (filter, sort, count).
- **Sigma (art lens grid)** - the object is the hero: thin hairline grid, one quiet label block per piece, and an occasional large editorial image inside the grid.
- **Current Hawks Closet** - keep the search bar up front, size filtering, available/sold visibility, and the add-to-cart animation into the cart drawer.

## Scope (v1)
- **Look:** gallery-white walls, black type, restrained and precise motion (slow fades, smooth page transitions, subtle depth on hover). Current logo kept; fonts chosen to fit.
- **Shirts:** background-free cutouts shown at a consistent scale with generous white space and a soft sense of depth, never cropped to the tile edges.
- **Grid / collections:** year + title, size and price on every card; quick add; search, size filter, availability filter, sort and item count; works one-handed on a phone.
- **Sold pieces:** stay on the walls, marked with a gallery-style red dot and "Sold", still viewable.
- **Product page:** minimal like Yeezy: name, price, size, buy. Large floating piece, zoom and alternate views, measurements available without clutter.
- **Cart:** drawer with the existing add-to-cart animation, straight path to Shopify checkout.
- **Archive:** every sold piece, browsable by drop or year.
- **About:** short brand page.
- **Upcoming pieces:** announced pieces can be teased with a notify-me signup (existing SMS signup).
- **Launch page:** password page with a countdown to **Friday, October 16, 2026, 12:00 noon New York time (EDT)**, a slot for Max's launch video (16:9 desktop, 9:16 mobile), and the current photo background until the video exists.
- **Quality bar:** fast on mobile, accessible (keyboard, screen readers, reduced motion), nothing that looks templated or AI-made.

## Not in scope
- A native iOS/Android app.
- Redesigning Shopify's checkout pages beyond the logo and colors Shopify allows.
- Real 3D shirt models.
- Rewriting product descriptions (the product pages stay minimal).
- Paid apps or services unless Max approves them.

## Milestones
1. **Direction check** - one home/grid screen and one product page, built locally with real products, for Max to judge the look before anything else is built.
2. **Browse and buy** - full collection grid with search, filters and sort, product page, cart drawer and quick add.
3. **Gallery pages** - archive, about, sold treatment, upcoming pieces with notify-me.
4. **Launch page and hardening** - countdown and video slot, speed and accessibility pass, full test run, uploaded as an unpublished Shopify preview for Max to click through.
5. **Launch, October 16 at noon** - publish the theme and remove the store password on a checklist Max approves in advance.

## Acceptance criteria
- Max can open the site on his phone and laptop and it reads as a gallery, not a template.
- Max can find any shirt by typing part of its name in search.
- Max can show only available pieces in his size in two taps or fewer.
- Max can add a piece to the cart from the grid without opening its page, and see it arrive in the cart drawer.
- Max can see sold pieces marked Sold, and cannot add them to the cart.
- Max can open the archive and browse past pieces.
- Max can open the password page and see the countdown to October 16 at noon New York time; after he drops in the two video files, the right one plays on desktop and on phone.
- Max can click through the whole flow on the Shopify preview theme before anything goes live.

## Open questions
- Are the product cutouts consistent in angle and framing? Uneven ones may need retouching to hold the same scale on the grid.
- Editorial images for the grid (Sigma-style large tiles): does Max have photos, or do we skip them in v1?
- When will the launch videos be delivered? They are needed before milestone 4 is finished.
- Launch-day unlock: removing the store password is a manual Shopify setting. Who flips it at noon, and what is the fallback?
- The previous brief (password page, now done) is in `docs/archive/`.
