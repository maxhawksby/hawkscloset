# Hawks Closet — Per-Piece Listing Template

Copy this whole file for each new piece. Fill the **Raw Notes** section first; the rest is generated from it (either by you using the format guide, or by pasting raw notes into chat).

The "→ Shopify field" tags tell you exactly where each value goes inside Shopify Admin → Products → [your product].

---

## 0. Raw Notes (fill this first)

```
Band / brand:
Year or era:
Garment type:           (Tee / Longsleeve / Sweatshirt / Hoodie / Jacket / Hat / Pants / Other)
Tagged size:
Pit-to-pit (in):
Shoulder-to-hem (in):
Color / colorway:
Print location:         (front / back / both / sleeve / AOP)
Construction tells:     (single-stitch / double-stitch / blank tag / RN# / made-in)
Material / fabric:
Condition notes:        (flaws — small holes, stains, fading, etc. Or "flawless")
Provenance:             (source — estate sale / thrift / yard sale — optional)
Price ($):
Photo filenames:        (image-1.jpg = front, image-2.jpg = back, image-3.jpg = tag, image-4.jpg = flat lay, etc.)
```

---

## 1. Title  → Product → Title

**Format:** `[Year/Era] [Band/Brand] [Garment Type] — [Size]`

- Title Case (capitalize main words)
- Year first if you have a date code; otherwise lead with decade (`90s`, `2000s`, `Y2K`)
- Size as a single letter at the end after an em dash

**Good:** `1997 Jane's Addiction Longsleeve — L`
**Good:** `90s Guns N' Roses Skull All-Over-Print Tee — L`
**Bad:** `90s you suck blow me` (no caps, no garment type, no size)

```
Title:
```

---

## 2. Description  → Product → Description

**Format:** 3 short paragraphs. Voice stays dealer-honest — no marketing fluff. Front-load era/band/garment keywords in paragraph 1.

- **Paragraph 1 (Hook — 1 sentence):** Era + Band + Garment + one defining detail. This is what Google previews.
- **Paragraph 2 (Details — 2–3 sentences):** Print description, construction tells, condition specifics. Be honest about flaws.
- **Paragraph 3 (Measurements):** Pit-to-pit × shoulder-to-hem, tagged size, fit note.

**Example:**

> A 1997 Jane's Addiction longsleeve from the Kettle Whistle reissue tour — heavyweight cotton, screen-printed back graphic in full color.
>
> Single-stitch sleeves and a 90s Hanes tag confirm the era. The print sits clean across the back with no cracking; front graphic shows light wear consistent with age. No holes, no stains.
>
> Measures 22 × 29 (pit-to-pit × shoulder-to-hem). Tagged Large, fits true to a modern Medium/Large.

```
Description:
```

---

## 3. Product Type  → Product → Product type

Pick exactly one from the controlled vocabulary. Don't invent new types.

- `Tee`
- `Longsleeve`
- `Sweatshirt`
- `Hoodie`
- `Jacket`
- `Hat`
- `Pants`
- `Other`

```
Product type:
```

---

## 4. Tags  → Product → Tags

Flat, lowercase, kebab-case. Every piece gets one tag from each required category.

**Drop** (REQUIRED, always first): the drop this piece belongs to.
- `drop-01` / `drop-02` / `drop-03` / etc.
- This is what powers the per-drop "Available" smart collection. Without it, the piece won't show up at `/collections/drop-NN-available`.

**Era** (always pick one):
- `90s` / `2000s` / `y2k` / `80s` / `70s`

**Genre** (pick all that apply):
- `band-tee` / `movie-promo` / `aop` / `tour-tee` / `sports` / `cartoon` / `harley` / `single-stitch`

**Subject / band** (always include if there's a named subject):
- `metallica` / `guns-n-roses` / `janes-addiction` / `system-of-a-down` / `wizard-of-oz` / etc.
- Format: lowercase, hyphenate spaces, no apostrophes (`guns-n-roses` not `guns-n'-roses`)

**Condition** (always pick one):
- `flawless` / `light-wear` / `distressed` / `as-is`

**Example tag set for a 1997 Jane's Addiction longsleeve in Drop 02:**
`drop-02, 90s, band-tee, tour-tee, janes-addiction, single-stitch, flawless`

```
Tags:
```

---

## 5. Variant Size  → Product → Variants → Size option

Set the variant's **Size** option to the size letter only. This is what the storefront size filter reads.

```
Size option value:   L      (or XS / S / M / L / XL / XXL / OS)
Variant title:       (auto-fills to match the size option value)
```

Measurements go in description paragraph 3 — NOT in the variant title.

---

## 6. Metafields  → Product → Metafields (custom namespace)

These render directly on the product page as a "Specs" block. Keep them **short, single-purpose, and clean** — they appear as labeled rows on the PDP.

```
custom.condition:    (e.g. "Flawless" / "Light fading at collar" / "Minor hole at hem — photographed")
custom.size:         (just the letter — "L" / "XL" / "OS". Same as the variant size option.)
custom.era:          (e.g. "1997" or "Late 90s")
custom.material:     (e.g. "100% Cotton, Single Stitch")
```

**Why `custom.size` AND the variant size option:** the variant powers the storefront filter (and is what shoppers see in the variant picker); the metafield powers the labeled "Size" spec row on the PDP. They should match. If `custom.size` is blank, the theme falls back to the variant title — so leaving it blank is safe for filtering, but the spec row will then show the variant title verbatim.

---

## 7. Per-Image Alt Text  → Each image → Alt text field

Click each image in the Media gallery, then "Edit alt text". The theme now honors whatever you set here.

Standard sequence (skip any that don't apply):

```
Image 1 (front graphic):     [Year] [Band] [Garment] — front graphic, [color] colorway
Image 2 (back graphic):      [Year] [Band] [Garment] — back graphic
Image 3 (tag / label):       [Year] [Band] [Garment] — [tag brand/era] inner tag
Image 4 (flat lay measure):  [Year] [Band] [Garment] — laid flat with measurements
Image 5+ (detail / flaw):    [Year] [Band] [Garment] — [what's shown, e.g. "stitching detail", "fade at hem"]
```

**Example for a 1997 Jane's Addiction longsleeve:**
- Image 1: `1997 Jane's Addiction Longsleeve — front graphic, black colorway`
- Image 2: `1997 Jane's Addiction Longsleeve — back graphic, Kettle Whistle tour print`
- Image 3: `1997 Jane's Addiction Longsleeve — Hanes single-stitch inner tag`
- Image 4: `1997 Jane's Addiction Longsleeve — laid flat, 22×29 measurements`

---

## 8. Search Engine Listing  → Product → "Edit website SEO" section

Three fields. All three matter — Google reads them, social cards use them, your URL stays clean.

### SEO Title (50–60 characters)
**Format:** `[Title] | Hawks Closet Vintage`

Examples:
- `1997 Jane's Addiction Longsleeve L | Hawks Closet Vintage`  (56 chars ✓)
- `90s Guns N' Roses AOP Tee L | Hawks Closet Vintage`  (50 chars ✓)

```
SEO title:
```

### Meta Description (140–160 characters)
**Format:** include era + band + garment + condition + size + at least one descriptive adjective.

Example:
- `Authentic 1997 Jane's Addiction longsleeve from the Kettle Whistle tour. Single-stitch Hanes, flawless condition. Tagged L (22×29). One of one.` (140 chars ✓)

```
Meta description:
```

### URL Handle (kebab-case)
**Format:** `[year]-[band]-[garment]` — lowercase, hyphens only, no apostrophes or special chars.

- Good: `1997-janes-addiction-longsleeve`
- Bad: `90s-you-suck-blow-me-1` (no year specificity, "-1" suffix means a previous listing collision)

```
URL handle:
```

---

## Pre-Publish Checklist

Before clicking "Save" / "Publish" in Shopify Admin:

- [ ] Title is Title Case, includes era + band + garment + size
- [ ] Description is 3 paragraphs (hook / details / measurements)
- [ ] Product type is set (not blank)
- [ ] **Tags include `drop-NN` first** (e.g. `drop-02`), plus era + genre + subject + condition (minimum 5 tags total)
- [ ] Variant Size option is set to the size letter (`L`, `XL`, `OS`) — drives the storefront filter
- [ ] All 4 custom metafields (condition, size, era, material) are filled; `custom.size` matches the variant size letter
- [ ] Every image has its own alt text (not blank, not auto-fallback)
- [ ] SEO title fits under 60 chars
- [ ] Meta description fits under 160 chars
- [ ] URL handle is clean kebab-case with year
- [ ] Price is set, inventory quantity is 1 (one-of-one)
- [ ] Manually added to the matching manual collection (e.g. `drop 02`)

After publish: send the live URL to chat — I'll spot-check it with `get-product` and flag anything missing.
