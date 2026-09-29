# Listing spec: how a piece goes into Shopify

This is the contract between Max's photos and the gallery theme. The upcoming Shopify listing skill follows it exactly; the theme reads these fields.

## What Max provides per piece
- Flat-lay photos (first photo = the one on the wall). Front first, then back, tag and details.
- Title: year and name, e.g. `1997 Chicago Bulls Rap Tee`, `90s Goosebumps`.
- Size, measurements (pit to pit / length, inches), price, condition.

## How the listing is built
| Field | Value | Why |
|---|---|---|
| Title | `YEAR Name` (year first: `1997`, `90s`, `2000s`) | The theme splits the first word into the label's year line and uses it for the archive's decade filter. |
| Description, line 1 | `23/30 \| tagged XL` | The theme reads the leading numbers as the measurements ("XL \| 23/30"). A note after them is fine: `25/29 (fits L)`. |
| Description, next lines | condition line, then the standard lines below | Shown under Details on the piece page. |
| Option | one option named `Size`, one value (`S`, `M`, `L`, `XL`, `2XL`) | Size chips and the "XL \| 23/30" label. |
| Price | whole dollars | Shown as `$350`. |
| Inventory | tracked, quantity 1, location 704 Hatchery Court | One of one. When it sells, stock hits 0 and it moves to the Archive by itself. |
| Vendor | `Hawk's Closet` | Matches the existing catalog. |
| Tags | `drop-03` (the current drop) | Archive "Drop" filter. Add `upcoming` to tease a piece as Coming soon with Notify me. |
| Collection | `Now showing` (handle `now-showing`, manual) | The home wall shows this collection. Create it with the first listing. |
| Status | Draft while building; Active when early access opens | Premium buyers see Active pieces with the store password (see LAUNCH.md). |
| Photos | square or near-square, at least 2000 px, even framing, plain background | Pieces float at one scale on the wall. |

Standard description lines after the condition line:
```html
<p>measurements taken from pit to pit x top of shoulder to bottom hem.</p>
<p>Each piece was carefully selected, with every item telling a different story through unique artwork, wear, age &amp; look.</p>
<p><em><b><span>All </span></b></em><strong>Sales are Final (no exchanges or returns)</strong></p>
```

## Optional
- A `custom.measurements` product metafield overrides line 1 if Max ever wants measurements outside the description.
