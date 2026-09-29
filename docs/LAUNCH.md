# Launch plan: Friday, October 16, 2026, 12:00 noon New York

Goal: the gallery opens at noon with nobody at the keyboard.

## Why not "remove the password at noon"
Shopify has no API, Flow action or setting on the Basic plan that switches the store password off on a schedule. Launchpad can, but it is Plus only. Apps that claim to do it use their own lock screen instead, and a browser bot logging into the admin breaks Shopify's terms and can be stopped by 2FA. Research notes: 2026-09-28 session.

## The plan: the theme holds the countdown, Shopify publishes the pieces
1. **New pieces are scheduled, not live.** Every new piece is set to Active and scheduled to publish on the Online Store at 2026-10-16 12:00 (America/New_York). Shopify's scheduled publishing does this by itself; it is the real lock. A piece left in Draft will not appear.
2. **The launch screen covers the site until noon.** The gallery theme's setting *Launch > Show the launch screen until the launch time* makes every page show the countdown until `next_drop_at`. At zero, open screens reload themselves into the gallery.
3. **The password comes off early, by hand, on Thursday evening.** Once the gallery theme is live with the launch screen on, the store password is no longer needed. Everything already on the store is sold, so nothing can be bought early.

## Checklist
Before launch week:
- [ ] Max loads the 15-20 new pieces (flat lays), in a collection for the home wall (for example "Now showing").
- [ ] Each new piece: Active, Online Store scheduled for Oct 16 12:00 PM ET.
- [ ] Upload `gallery-theme/` as an **unpublished** theme. Max clicks through the Shopify preview (milestone 4 sign-off).
- [ ] On that preview, confirm the launch screen turns off when the launch time is set a few minutes ahead, then set it back. The local preview cannot test Shopify's own clock.
- [ ] Theme settings: home wall collection, archive handle (`archive`), Klaviyo keys, launch videos when they arrive.
- [ ] Create the About page in Shopify with the template `page.about`.

Thursday, October 15, evening (Max approves each step):
- [ ] Publish the gallery theme with the launch screen **on**.
- [ ] Open hawkscloset.com in a private window: countdown shows, no pieces visible.
- [ ] Remove the store password (Online Store > Preferences).
- [ ] Private window again: still the countdown on /, /collections/all and a product URL.

Friday, October 16, at noon (automatic):
- Shopify publishes the new pieces; the launch screen switches off; open countdowns reload into the gallery.
- 12:05 check (optional): open the site, add a piece to a cart, reach checkout. Turn the launch-screen setting off so it no longer needs checking.

## Fallback
If anything looks wrong on Thursday, keep the store password on and remove it by hand at noon. Someone with admin access should be free at 11:55 either way.

## Known limits
- Shopify may serve a cached copy of the launch screen for a few minutes after noon. The page reloads itself, and pieces become buyable only at their scheduled time, so the risk is a short delay, not an early sale.
- The launch screen is a display, not a lock: a determined visitor could reach old product pages. All of them are sold.
