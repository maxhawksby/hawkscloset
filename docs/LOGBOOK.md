# Hawks Closet logbook

Goal: hawkscloset.com relaunched as an Awwwards-level gallery storefront, with new pieces listed and real checkout working.
Updated: 2026-11-01 by crewmate (Builder, moved from memory resume point)
Resume here: read [STATUS.md](STATUS.md) "Pick up here" (saved 2026-09-29), then start listings.

High risk ship: this is a live store with real checkout. Every publish, price, listing or public wording change waits for Max.

## Epics
- E1 Gallery theme built and on Shopify (unpublished theme Hawks Closet Gallery `154214072398`) - done
- E2 Listings: new pieces into the `now-showing` collection - open
- E3 Lock screen (password page) redone in the gallery look - open
- E4 Launch per [LAUNCH.md](LAUNCH.md) - open (planned date Friday 2026-10-16 has passed; current status not recorded here)

## Tasks
- [ ] T1 Build a Shopify listing skill (via /new-skill in agent-hq) that follows [LISTING.md](LISTING.md) and puts each piece in `now-showing` - epic E2 - owner: Builder - blocked by: none
- [ ] T2 Max sends flat-lay photos and details for each piece - epic E2 - owner: Max - blocked by: none
- [ ] T3 Load the first new pieces (memory plan: 15-20 new test items) - epic E2 - owner: Builder - blocked by: T1, T2
- [ ] T4 Redo the lock screen (`gallery-theme/snippets/launch-screen.liquid`, countdown + Early access box) to match the gallery look; asked 2026-09-29, not started - epic E3 - owner: Builder - blocked by: none
- [ ] T5 Launch: premium early access with the store password, Max unlocks by hand at noon - epic E4 - owner: Max - blocked by: T3, T4, Max decision
- [x] T0 Gallery theme finished and pushed unpublished; Archive smart collection holds all 175 sold products; About + Contact pages - done 2026-09-29

## Decisions
- 2026-09-27 Rebuild as an Awwwards-level gallery storefront - why: Max's plan for the relaunch.
- 2026-09-29 Home wall shows the `now-showing` collection automatically; empty state says "New pieces are being hung" - why: listings drive the home page.
- Launch is unlocked by hand, never automatically - why: the countdown alone does not unlock Shopify.

## Not yet decided
- Whether the 2026-10-16 launch happened or moved; check STATUS.md and the live store with Max before acting.

## Out of scope
- Publishing or uploading theme changes without Max's approval.

## Glossary
- Now showing: the Shopify collection the home wall displays.
- Archive: smart collection holding sold products.
- Lock screen: the store password page with the countdown.

## Links
- [STATUS.md](STATUS.md) - single status file, "Pick up here" section
- [BRIEF.md](BRIEF.md) - the rebuild brief
- [LAUNCH.md](LAUNCH.md), [LISTING.md](LISTING.md), [TASKS.md](TASKS.md)
- Theme preview: https://ri5pxg-pg.myshopify.com?preview_theme_id=154214072398

## History
- From memory resume point (moved 2026-11-01): Hawks Closet (`~/personal/hawkscloset`) is being rebuilt as an Awwwards-level gallery storefront, launching Friday 2026-10-16 at noon New York time. Planned 2026-09-27; no rebuild code written yet at that time.
- Old resume agenda (2026-09-27, superseded by STATUS.md 2026-09-29): when Max says "pick up where we left off" in `~/personal`, read `hawkscloset/docs/STATUS.md` ("Pick up here" section) and `hawkscloset/docs/BRIEF.md`, then: baseline commit approval, Shopify connection check, move all sold products into an Archive collection, help load 15-20 new test items, then milestone 1.
- Why it existed: Max asked to be able to resume the next morning with one phrase. Rule kept: once the agenda moves on, update STATUS.md and this logbook so they don't point at finished steps.
