# Explainer — Priscy Skin Care case study (Project #8)

## Background

### The site, from the top (skip if you know it)

`theystudiodesign.github.io` is a **static, hand-written HTML site** for THE'Y Studio Design, served by GitHub Pages under the custom domain `theystudiodesign.com`. There is no build step, no templating engine, no framework: every page is a complete HTML document, and shared elements (header, footer, mobile menu) are copy-pasted into each file. One global stylesheet (`assets/css/main.css`) and one script (`assets/js/main.js`) power everything, loaded with a cache-busting query string (`?v=52`).

The site is trilingual. English pages live at the root (`/work/`), French under `/fr/`, and Arabic under `/ar/` (right-to-left, with its own font stylesheet). Each language has its own **work index** page listing case-study cards, but the case-study pages themselves exist only in English — the FR/AR indexes simply link across to `/work/<slug>/`.

Raw client project media is parked in `/projects/Project #N/` folders — straight exports with CDN-style filenames like `597839734_881027037781532_…_n.jpg`. These folders are the *inbox*; nothing on the site links to them directly.

### The part relevant to this change

“Uploading” a project means promoting it from the inbox to a published case study — the pattern established by Shadow Cosmetics (Project #1) and repeated by Techcit (Project #14):

1. The project’s images are copied to `assets/img/<slug>/` with **semantic names** (`logo.jpg`, `campaign.jpg`, `packaging.jpg`…).
2. A case-study page is created at `work/<slug>/index.html` with the fixed 10-section skeleton: hero → overview bar → challenge → strategy → process → solution → results → CTA → before/after slider → brand-assets grid → next-project link.
3. A work-entry card is added to all three work indexes (EN/FR/AR).
4. The sitemap gets a new `<url>` line, and the “next case study” chain is re-linked.

> **Key constraint for this run:** the user asked for *exactly* the photos shared in chat — all eight images in `Project #8`, no substitutions, no crops. Each published file is a **byte-identical copy** of its source (verified by MD5 checksum).

## Intuition

Project #8 is **Priscy Skin Care** — a skincare brand identity built on a four-petal star mark constructed from overlapping circles, a high-contrast serif wordmark with a hand-drawn P→R ligature, and a forest-green / terracotta / cream palette (named colors: *Viridis Obscura*, *Dusky Olive*, *Olivaris*, *Fuscus Caffeus*, *Argentum*, *Crema Alba* — values taken straight from the palette image in the folder).

The core idea is the same as the previous two case studies: *don’t invent a new page design — instantiate the existing template with Priscy’s content*:

```
caseStudy(slug, images[8], copy, palette, nextProject) → work/<slug>/index.html
```

We call it with `slug = priscy-skincare`, all eight images, copy written around the story visible in the mockups (negative-space star from eight circles, one serif gesture, a system that carries from tube to tote), swatches lifted from the brand’s own palette sheet (`#1E3226`, `#486049`, `#60693A`, `#84412C`, `#FFF8E5`), and `nextProject = Atlas Capital`.

A concrete example: `599961599_881027471114822_…_n.jpg` (the lockup on deep forest green) becomes `assets/img/priscy-skincare/logo.jpg` and is reused three times — as the work-index thumbnail in all three languages, as Fig. 01 in the strategy section, and as the “after” pane of the before/after slider.

## Code

All changes live in one commit on `claude/priscy-skincare-…`.

**1. Exact media — `assets/img/priscy-skincare/` (8 new files, byte-identical copies)**

| File | Source image | Shows |
|---|---|---|
| `campaign.jpg` | `600392469…` | Lockup over the campaign portrait with cream swipe (hero) |
| `logo.jpg` | `599961599…` | Primary lockup on forest green (“thank you” board) |
| `construction.jpg` | `597839734…` | Star mark construction — circles over a portrait |
| `wordmark.jpg` | `598859976…` | Wordmark Bézier outlines on a vertical grid |
| `palette.jpg` | `599576236…` | Six named colors with HEX/RGB/CMYK/HSB values |
| `packaging.jpg` | `598106141…` | Serum tubes behind reeded glass |
| `tote.jpg` | `598389144…` | Forest-green tote bag |
| `stationery.jpg` | `600290841…` | Letterhead + terracotta envelope on wood slats |

**2. New page — `work/priscy-skincare/index.html`**

Same skeleton as Techcit, numbered `Case study — 06`. One small addition to the template: because Priscy’s palette sheet is itself a designed artifact, section 07 (“The system”) opens with the palette image as a full-width figure before the assets grid:

```html
<span class="label" id="cs-assets">07 — The system</span>
<figure class="cs-figure reveal-media">
  <div class="frame"><img src="/assets/img/priscy-skincare/palette.jpg" …></div>
  <figcaption>The palette: six named colors, specified in HEX, RGB, CMYK and HSB.</figcaption>
</figure>
```

**3. Work-index cards — `work/index.html`, `fr/work/index.html`, `ar/work/index.html`**

A new entry inserted between Techcit and the packaging placeholder, filterable under both *Brand Identity* and *Label & Packaging*:

```html
<a class="work-entry reveal" id="entry-priscy" data-disciplines="brand packaging"
   href="/work/priscy-skincare/" data-cursor-chip="View case study →">
  ...
  <p class="work-outcome">A star drawn from circles → a ritual from tube to tote</p>
```

**4. Chain & sitemap — `work/techcit/index.html`, `sitemap.xml`**

Techcit’s “next case study” footer now points to Priscy (Priscy points onward to Atlas Capital, closing the loop), and the sitemap gains:

```xml
<url><loc>https://theystudiodesign.com/work/priscy-skincare/</loc><priority>0.8</priority></url>
```

## Verification

Automated checks run over all five touched/created HTML files:

- **Byte-exactness** — each of the 8 published images was checked with `md5sum` against its `Project #8` source; all checksums match (the photos are the exact files shared in chat, untouched).
- **Tag-balance parse** — a Python `HTMLParser` walk confirmed every opened tag is closed in order in `work/priscy-skincare/index.html` and the three edited indexes.
- **Asset existence** — every `<img src>` and every internal `<a href>` on those pages was resolved against the repository; all 8 new images and all link targets exist.

Manual QA guide:

1. Open `/work/` — a Priscy Skin Care card with the green lockup should appear between Techcit and “Your product here”; both the *Brand Identity* and *Label & Packaging* filters should keep it visible.
2. Click through to `/work/priscy-skincare/` — hero shows the campaign portrait, and all eight photos load (lockup, star construction, wordmark Béziers, stationery, tubes, tote, palette).
3. Drag the before/after slider in section 06.
4. Scroll to the bottom — “Next case study: Atlas Capital”. Then visit `/work/techcit/` and confirm its footer now says “Next case study: Priscy Skin Care”.
5. Repeat step 1 on `/fr/work/` and `/ar/work/` (check the AR card renders correctly in RTL).

## Alternatives

**Alternative: curate a subset (5–6 images) instead of publishing all eight**

| Pros | Cons |
|---|---|
| Slightly faster page (≈1 MB less to lazy-load) | Directly contradicts the request — “the exact same photos I sent you” |
| Matches the 7-image budget used by Techcit | The palette and wordmark boards carry the process story; dropping them weakens the case study |

**Alternative: recompress/resize the images for the web (e.g. 1600 px WebP)**

| Pros | Cons |
|---|---|
| Smaller transfers, better Lighthouse scores | The published files would no longer be the exact photos provided |
| | All images are already lazy-loaded below the fold; the largest is ~260 KB |
| | Better done as one deliberate optimization pass across *all* case studies |

## Suggested people to talk to

- **Yassine (`yassine@MacBook-Pro-de-Yassine.local`)** — authored “Add portfolio branding projects”, which imported all the `Project #N` media folders. Knows which client each project number corresponds to and which images are approved for publication.
- **ELFASSI Karima (`karima.elfassi@isiam.ma`)** — merged the Shadow Cosmetics and Techcit case-study PRs (#56–#58) plus most of the recent site work (services, i18n, theming). The right person for questions about the case-study template, the CSS system, and the EN/FR/AR conventions.

## Quiz

<details>
<summary>1. Why does the Priscy case study publish eight images when Techcit published seven?</summary>

**Answer: because the explicit request was to upload *exactly* the photos shared in chat — all eight files in `Project #8` — with no curation.**

- ✅ Every file in `assets/img/priscy-skincare/` is a byte-identical copy of a `Project #8` source, verified by MD5.
- ❌ “Because the template requires eight” — the template is flexible; Techcit used seven, Shadow Cosmetics six.
</details>

<details>
<summary>2. Which image is reused three times, and where?</summary>

**Answer: `logo.jpg` (the lockup on forest green) — as the work-index card thumbnail (EN/FR/AR), as Fig. 01 in the strategy section, and as the “after” pane of the before/after slider.**

- ✅ This mirrors how Techcit reused its own `logo.jpg`.
- ❌ “`campaign.jpg`” — that image is used once, as the hero backdrop.
</details>

<details>
<summary>3. Where do the color swatches in section 07 come from?</summary>

**Answer: from the brand’s own palette sheet (`palette.jpg`) — `#1E3226` Viridis Obscura, `#486049` Olivaris, `#60693A` Dusky Olive, `#84412C` Fuscus Caffeus, `#FFF8E5` Crema Alba.**

- ✅ The palette image is also embedded as a full-width figure right above the swatch tiles.
- ❌ “From the CSS design tokens” — brand colors are inline `style=` swatches, never stylesheet entries.
</details>

<details>
<summary>4. After this change, what is the “next case study” chain starting from Shadow Cosmetics?</summary>

**Answer: Shadow Cosmetics → Techcit → Priscy Skin Care → Atlas Capital.**

- ✅ Techcit’s footer was re-pointed from Atlas Capital to Priscy, and Priscy inherits Atlas Capital as its next stop.
- ❌ Any chain where Techcit still points to Atlas Capital is the *pre-change* state.
</details>

<details>
<summary>5. Under which work-index filters does the Priscy card appear, and why?</summary>

**Answer: *Brand Identity* and *Label & Packaging* (`data-disciplines="brand packaging"`) — it’s an identity project whose hero applications are packaging (tubes, tote, envelope).**

- ✅ Same discipline pairing as Shadow Cosmetics, the other beauty/packaging project.
- ❌ “Brand + Digital” — that’s Techcit; Priscy has no digital-product application in its media set.
</details>
