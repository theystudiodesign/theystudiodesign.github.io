# Explainer — Almeida Quiami Building case study (Project #11)

## Background

### The site, from the top (skip if you know it)

`theystudiodesign.github.io` is a **static, hand-written HTML site** for THE'Y Studio Design, served by GitHub Pages under the custom domain `theystudiodesign.com`. There is no build step, no templating engine, no framework: every page is a complete HTML document, and shared elements (header, footer, mobile menu) are copy-pasted into each file. One global stylesheet (`assets/css/main.css`) and one script (`assets/js/main.js`) power everything, loaded with a cache-busting query string (`?v=52`).

The site is trilingual. English pages live at the root (`/work/`), French under `/fr/`, and Arabic under `/ar/` (right-to-left, with its own font stylesheet). Each language has its own **work index** page listing case-study cards, but the case-study pages themselves exist only in English — the FR/AR indexes simply link across to `/work/<slug>/`.

Raw client project media is parked in `/projects/Project #N/` folders — straight exports with CDN-style filenames like `748370202_1056076630410965_…_n.jpg`. These folders are the *inbox*; nothing on the site links to them directly.

### The part relevant to this change

Publishing a project means promoting it from the inbox to a case study — the pipeline established by Shadow Cosmetics (#1), Techcit (#14), Priscy Skin Care (#8) and Mira Beauty (#9):

1. Copy the project's images to `assets/img/<slug>/` with **semantic names** (`logo.jpg`, `stationery.jpg`, `hoarding.jpg`…).
2. Create a case-study page at `work/<slug>/index.html` with the fixed skeleton: hero → overview bar → challenge → strategy → process → solution → results → CTA → before/after slider → brand-assets grid → next-project link.
3. Add a work-entry card to all three work indexes (EN/FR/AR).
4. Add a `<url>` line to the sitemap and re-link the "next case study" chain.

> **Key constraint, carried over from every previous case study:** every published image is a **byte-identical copy** of a file in `projects/Project #11/` — copied with `cp`, verified by size and checksum. No crops, no re-encodes, no substitutions.

## Intuition

Project #11 is **Almeida Quiami Building** — a civil construction company (*construção civil*) based in Luanda, Angola, that manages and executes *obras de grande porte* (large-scale works: the mockups show a school hoarding, "Nova Escola em construção"). The identity merges the lowercase **a** of Almeida and the capital **Q** of Quiami into one square, single-stroke badge — the Q's diagonal tail leaving the frame like a ramp on a site drawing. The palette is high-visibility **site orange** (`#F14E23`) on deep **engineer navy** (`#10293D`) with an off-white ground.

The core move is the same as the previous case studies: *don't invent a new page design — instantiate the existing template with Almeida Quiami's content*:

```
caseStudy(slug, images[9], copy, palette, nextProject) → work/<slug>/index.html
```

We call it with `slug = almeida-quiami`, all nine images from the folder (this project uses every file in the inbox — none were left behind), copy written around the story visible in the mockups ("a monogram drawn like a floor plan", from chest pocket to hoarding), swatches sampled from the brand's own sheets, and `nextProject = Atlas Capital`.

A concrete example: `748370202_…_n.jpg` (the orange lockup on the navy-to-orange gradient) becomes `assets/img/almeida-quiami/logo.jpg` and is reused three times — as the work-index thumbnail in all three languages, as Fig. 01 in the strategy section, and as the "after" pane of the before/after slider.

Two things make Almeida Quiami different from the beauty brands that preceded it:

- **It's the first construction/B2B-services case study**, so the work-index card gets a new sector tag — *Construction* — and the copy leans on credibility and scale rather than shelf appeal.
- **There's no packaging and no digital layer.** Instead the applications are *environmental*: an ID badge, embroidered workwear, a full construction hoarding and a street poster. The solution section pivots accordingly ("Then the identity walked onto the site") and the disciplines attribute is just `data-disciplines="brand"`, so the card appears under **Brand Identity** only.
- **The "system" section has no board figure.** The folder contains nine images and all nine earn a specific slot earlier in the page; rather than repeat one, the section opens directly with the assets grid (typography specimen, swatch row, three principle tiles). The template tolerates this: the grid is self-contained.

One image deserves a note: the aerial shot of the monogram **excavated into the ground** of a live site (`746503110_…_n.jpg` → `excavation.jpg`). It's the campaign's proof-of-concept — a logo simple enough to be dug by machine — and the page uses it as Fig. 03 in the process section with the caption "If a logo can be dug, it can be built."

## Code

All changes live in one commit on `claude/almeida-quiami-case-study-…`.

### 1. Nine images promoted from the inbox

| Source (`projects/Project #11/`) | Published as | Used for |
|---|---|---|
| `747307201_…_n.jpg` | `site.jpg` | Hero backdrop (engineer at the hoarding) |
| `748370202_…_n.jpg` | `logo.jpg` | Index card, Fig. 01, before/after |
| `748718347_…_n.jpg` | `construction.jpg` | Fig. 02 — a + Q equation & colourways |
| `746503110_…_n.jpg` | `excavation.jpg` | Fig. 03 — monogram excavated as a foundation |
| `746716021_…_n.jpg` | `stationery.jpg` | Solution — folder, letterhead, envelope, card |
| `747168632_…_n.jpg` | `badge.jpg` | Solution — lanyard ID badge |
| `746662351_…_n.jpg` | `workwear.jpg` | Solution — chest-pocket print on work shirt |
| `748088702_…_n.jpg` | `hoarding.jpg` | Solution — "Nova Escola em construção" hoarding |
| `748312192_…_n.jpg` | `poster.jpg` | Solution — "Gestão rigorosa" street poster |

### 2. The case-study page

`work/almeida-quiami/index.html` — Case study — 08. The fixed skeleton with Almeida Quiami's content: hero over `site.jpg`, meta bar (Construction / Civil works · 2026 · 6 weeks), challenge ("a mark that signs a business card and a building site with the same authority"), strategy around the floor-plan monogram, process with the published a + Q equation and the excavation proof, solution in two movements (paper + people, then the street), results (6 wks / 3 scales / 1 stroke), before-after slider, assets grid with sampled swatches:

```html
<div class="swatch-row">
  <span class="swatch" style="background:#0B1C2B"></span>
  <span class="swatch" style="background:#10293D"></span>
  <span class="swatch" style="background:#F14E23"></span>
  <span class="swatch" style="background:#F79A73"></span>
  <span class="swatch" style="background:#EFEFEF"></span>
</div>
```

The typography specimen drops the `serif-accent` class used by the beauty brands — Almeida Quiami is a plain geometric sans, and the specimen should look like it.

### 3. Three index cards + chain re-link

The same card, translated three ways, inserted after Mira Beauty and before the "Your product here" packaging placeholder:

```html
<a class="work-entry reveal" id="entry-quiami" data-disciplines="brand"
   href="/work/almeida-quiami/" data-cursor-chip="View case study →">
  …
  <p class="work-outcome">An a + Q drawn like a floor plan → a mark that signs the site</p>
  <span class="label">Brand Identity</span><span class="label">Construction</span><span class="label">2026</span>
```

FR: *« Un a + Q tracé comme un plan → une marque qui signe le chantier »* · AR: «حرفا a وQ في مخطط واحد ← علامة توقّع موقع البناء».

Mira Beauty's next-project link, previously pointing at Atlas Capital, now points at Almeida Quiami; Almeida Quiami points at Atlas Capital — the chain stays a single loop.

### 4. Sitemap

One line appended before `</urlset>`:

```xml
<url><loc>https://theystudiodesign.com/work/almeida-quiami/</loc><priority>0.8</priority></url>
```

## Verification

Automated checks run in the sandbox before the commit:

- **XML validity** — `sitemap.xml` parses with `xml.etree.ElementTree`.
- **Asset existence** — every `/assets/img/…` path referenced by the five touched pages resolves to a file on disk.
- **Tag balance** — a Python `HTMLParser` walk over the new page reports no mismatched or unclosed tags.
- **Byte-identity** — the nine published images are `cp` copies of the originals (verified by md5).
- **Browser test** — the page and the EN work index were rendered with headless Chromium (Playwright) at 1440×1000: zero JS errors, zero failed local requests. Screenshots confirmed the hero, the process figures (equation + excavation), the assets grid, and the new index card render correctly.

To QA manually:

1. Serve the repo root (`python3 -m http.server`) and open `/work/almeida-quiami/`.
2. Scroll the full page: hero photo, five numbered sections, nine distinct photos, before/after slider drag.
3. Open `/work/`, `/fr/work/`, `/ar/work/` — the Almeida Quiami card should appear between Mira Beauty and "Your product here", and under the **Brand Identity** filter.
4. From `/work/mira-beauty/`, the "Next case study" footer should now lead to Almeida Quiami, and from there to Atlas Capital.
5. Check `sitemap.xml` contains the new URL.

## Alternatives

**Reuse one image as a "system board" figure in section 07 (like Mira's `grid.jpg`)**

| Pros | Cons |
|---|---|
| Keeps section 07 visually identical to the previous four case studies | Violates the one-slot-per-image economy of the page — a repeat photo reads as filler |
| A big closing visual is a strong end-beat | The folder simply has no board/grid image; faking one would break the byte-identity rule |

**Tag the project `data-disciplines="brand direction"` so it also appears under Art Direction**

| Pros | Cons |
|---|---|
| The excavation and hoarding shots are genuinely art-directed campaign images | The Art Direction filter currently means "campaign/photography engagements" (Dar Mimosa); mixing in an identity project dilutes the filter's meaning |
| One more surface for the project | The card copy is identity-led; discoverability under Brand Identity is where buyers of this service look |

## Suggested people to talk to

- **ELFASSI Karima** (`karima.elfassi@isiam.ma`) — authored every case study in this pipeline (Shadow Cosmetics, Techcit, Priscy, Mira Beauty) plus the work-index filter system; the single best person on the template's conventions, the byte-identity rule and the next-project chain.

## Quiz

<details>
<summary>1. Why does the Almeida Quiami case study have no figure in the "07 — The system" section, unlike Mira Beauty?</summary>

**Answer: The project folder contains exactly nine images and all nine are already used in specific slots earlier on the page.** Reusing one would repeat a photo, and creating a new collage would break the rule that every published image is a byte-identical copy of a file in `projects/Project #11/`. (It is *not* a CSS limitation, and *not* because the section is optional in the template — the other case studies all include a figure there.)
</details>

<details>
<summary>2. Which image is used three times, and where?</summary>

**Answer: `logo.jpg` (from `748370202_…_n.jpg`)** — as the work-index card thumbnail in all three languages, as Fig. 01 in the strategy section, and as the "after" pane of the before/after slider. The hero uses `site.jpg`, not the logo.
</details>

<details>
<summary>3. What changed in `work/mira-beauty/index.html`, and why?</summary>

**Answer: Only its "Next case study" footer link** — previously pointing to Atlas Capital, now pointing to `/work/almeida-quiami/` (with updated title and outcome line). Each new case study inserts itself into the next-project chain, so the previous newest project must be re-linked. No other Mira content changed.
</details>

<details>
<summary>4. The Almeida Quiami card uses `data-disciplines="brand"` while Mira Beauty uses `"brand packaging digital"`. What does this attribute control?</summary>

**Answer: The filter buttons on the work index.** `main.js` shows/hides `.work-entry` cards based on whether the active filter token appears in `data-disciplines`. Almeida Quiami has no packaging or digital deliverables, so it appears only under "All" and "Brand Identity" — not under Digital, Art Direction, or Label &amp; Packaging.
</details>

<details>
<summary>5. Why does the typography specimen tile omit the `serif-accent` class that Mira and Priscy use?</summary>

**Answer: Because the brand's typography is a plain geometric sans, and the specimen should demonstrate the brand's actual type voice.** `serif-accent` switches the specimen to the site's serif display face — right for the high-contrast serif wordmarks of the beauty brands, wrong for Almeida Quiami's flush, report-like sans. (It has no effect on filters, layout or performance.)
</details>
