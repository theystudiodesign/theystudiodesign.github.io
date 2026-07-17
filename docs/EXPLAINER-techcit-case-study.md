# Explainer — Techcit case study (Project #14)

## Background

### The site, from the top (skip if you know it)

`theystudiodesign.github.io` is a **static, hand-written HTML site** for THE'Y Studio Design, served by GitHub Pages under the custom domain `theystudiodesign.com`. There is no build step, no templating engine, no framework: every page is a complete HTML document, and shared elements (header, footer, mobile menu) are literally copy-pasted into each file. One global stylesheet (`assets/css/main.css`) and one script (`assets/js/main.js`) power everything, loaded with a cache-busting query string (`?v=52`).

The site is trilingual. English pages live at the root (`/work/`), French under `/fr/`, and Arabic under `/ar/` (right-to-left, with its own font stylesheet). Each language has its own **work index** page listing case-study cards, but the case-study pages themselves exist only in English — the FR/AR indexes simply link across to `/work/<slug>/`.

Raw client project media is parked in `/projects/Project #N/` folders — straight exports with Facebook-style CDN filenames like `707270388_1631554527925529_…_n.jpg`. These folders are the *inbox*; nothing on the site links to them directly.

### The part relevant to this change

“Uploading” a project means promoting it from the inbox to a published case study, a pattern established by Shadow Cosmetics (Project #1, PRs #56–#57):

1. A handful of the best images are copied to `assets/img/<slug>/` with **semantic names** (`logo.jpg`, `cards.jpg`, `campaign.jpg`…).
2. A case-study page is created at `work/<slug>/index.html` with a fixed 10-section skeleton: hero → overview bar → challenge → strategy → process → solution → results → CTA → before/after slider → brand-assets grid → next-project link.
3. A work-entry card is added to all three work indexes (EN/FR/AR).
4. The sitemap gets a new `<url>` line, and the “next case study” chain is re-linked.

The CSS that makes real photos fill their frames (`.media-fill img, .cs-figure .frame img … { object-fit: cover }`) was already added in PR #57, so no stylesheet changes were needed this time.

## Intuition

Project #14 is **Techcit** — a technology-company brand identity built on a volt-green (`#D5FF27`) TC monogram over near-black, with an italic wordmark and a visible construction grid. The folder holds 21 mockup images (plus one stray Ronica BeautyClub image that belongs to a different project and was ignored).

The core idea of this change is: *don’t invent a new page design — instantiate the existing template with Techcit’s content*. Think of the Shadow Cosmetics page as a function:

```
caseStudy(slug, images[7], copy, palette, nextProject) → work/<slug>/index.html
```

We call it with `slug = techcit`, seven curated images, copy written around the brand’s actual story visible in the mockups (screen-first identity, one accent color, grid-engineered monogram), the palette taken straight from the brand-guideline image in the folder (`#D5FF27` / `#0B0B0A` / `#FFFFFF`), and `nextProject = Atlas Capital`.

A concrete example of the curation step: the file `707270388_1631554527925529_2661096553769689620_n.jpg` (the primary lockup on a black/volt gradient) becomes `assets/img/techcit/logo.jpg`, and is reused three times — as the work-index thumbnail, as Fig. 01 in the strategy section, and as the “after” pane of the before/after slider.

## Code

All changes live in one commit on `claude/techcit-case-study-…`.

**1. Curated media — `assets/img/techcit/` (7 new files)**

| File | Source image | Shows |
|---|---|---|
| `campaign.jpg` | `708866457…` | Metro billboard poster (hero) |
| `logo.jpg` | `707270388…` | Primary lockup on black |
| `construction.jpg` | `707328145…` | Monogram on its grid |
| `cards.jpg` | `707510020…` | Business-card duplex grid |
| `stationery.jpg` | `707499162…` | Letterhead, cup, folder |
| `social.jpg` | `707125963…` | Instagram post |
| `devices.jpg` | `708210004…` | Tablet, app icon, payment card |

**2. New page — `work/techcit/index.html`**

Same skeleton as Shadow Cosmetics, numbered `Case study — 05`, with Techcit-specific copy and swatches:

```html
<div class="swatch-row">
  <span class="swatch" style="background:#0B0B0A"></span>
  <span class="swatch" style="background:#D5FF27"></span>
  ...
</div>
<span class="label">Color — noir, volt green, white, graphite</span>
```

**3. Work-index cards — `work/index.html`, `fr/work/index.html`, `ar/work/index.html`**

A new entry inserted between Shadow Cosmetics and the packaging placeholder, filterable under both *Brand Identity* and *Digital*:

```html
<a class="work-entry reveal" id="entry-techcit" data-disciplines="brand digital"
   href="/work/techcit/" data-cursor-chip="View case study →">
  ...
  <p class="work-outcome">A rebrand engineered on a grid → unmistakable at 16 px</p>
```

**4. Chain & sitemap — `work/shadow-cosmetics/index.html`, `sitemap.xml`**

Shadow’s “next case study” footer now points to Techcit (Techcit points onward to Atlas Capital, closing the loop), and the sitemap gains:

```xml
<url><loc>https://theystudiodesign.com/work/techcit/</loc><priority>0.8</priority></url>
```

## Verification

Automated checks run over all five touched/created HTML files:

- **Tag-balance parse** — a Python `HTMLParser` walk confirmed every opened tag is closed in order (no unbalanced markup) in `work/techcit/index.html` and the three edited indexes.
- **Asset existence** — every `<img src>` and every internal `<a href>` on those pages was resolved against the repository; all 7 new images and all link targets exist.

Manual QA guide:

1. Open `/work/` — a Techcit card with the volt-green lockup should appear between Shadow Cosmetics and “Your product here”; the *Brand Identity* and *Digital* filters should both keep it visible.
2. Click through to `/work/techcit/` — hero shows the metro billboard, the overview bar shows Client/Sector/Year, and all seven figures load.
3. Drag the before/after slider in section 06.
4. Scroll to the bottom — “Next case study: Atlas Capital”. Then visit `/work/shadow-cosmetics/` and confirm its footer now says “Next case study: Techcit”.
5. Repeat step 1 on `/fr/work/` and `/ar/work/` (check the AR card renders correctly in RTL).

## Alternatives

**Alternative: generate FR/AR translations of the full case-study page (`/fr/work/techcit/`, `/ar/work/techcit/`)**

| Pros | Cons |
|---|---|
| Fully localized experience; hreflang-complete for SEO | Breaks with the established pattern (Shadow Cosmetics has EN-only detail pages) |
| AR readers get the story in their language | Triples the copy-writing and maintenance surface for every future project |
| | Better done as one deliberate localization pass across *all* case studies |

## Suggested people to talk to

- **Yassine (`yassine@MacBook-Pro-de-Yassine.local`)** — authored “Add portfolio branding projects”, which imported all the `Project #N` media folders. Knows which client each project number corresponds to and which images are approved for publication.
- **ELFASSI Karima (`karima.elfassi@isiam.ma`)** — merged both Shadow Cosmetics PRs (#56, #57) plus most of the recent site work (services, i18n, theming). The right person for questions about the case-study template, the CSS system, and the EN/FR/AR conventions.

## Quiz

<details>
<summary>1. Why did this change require no CSS edits, while the Shadow Cosmetics work needed two?</summary>

**Answer: because the `object-fit: cover` rules for real project media were already added in PR #57.**

- ✅ Shadow Cosmetics was the *first* case study to use real photography; PR #56 added a placeholder gradient (`.ph-f`) and PR #57 added the `.media-fill img, .cs-figure .frame img … { object-fit: cover }` block. Techcit reuses those exact classes, so nothing new was needed.
- ❌ “Because Techcit uses no images” — false, it uses seven.
- ❌ “Because the volt-green color was already in the stylesheet” — brand colors are inline `style=` swatches, never stylesheet entries.
</details>

<details>
<summary>2. Where does the Techcit card appear in the work list, and under which filters?</summary>

**Answer: between Shadow Cosmetics and the “Your product here” placeholder, under *Brand Identity* and *Digital* (`data-disciplines="brand digital"`).**

- ✅ The placeholder card is intentionally kept last as a sales hook, so real projects are inserted before it.
- ❌ “Under Brand Identity and Packaging” — that’s Shadow Cosmetics (`brand packaging`).
</details>

<details>
<summary>3. The FR and AR work indexes link the Techcit card to `/work/techcit/` — not `/fr/work/techcit/`. Why?</summary>

**Answer: case-study detail pages exist only in English; the FR/AR indexes deliberately link across languages, matching the Shadow Cosmetics convention.**

- ✅ Only index/landing pages are translated; creating localized detail pages was considered and rejected as an alternative (see above).
- ❌ “It’s a typo/bug” — it mirrors the existing `entry-shadow` cards in both FR and AR indexes.
</details>

<details>
<summary>4. After this change, what is the “next case study” chain starting from Dar Mimosa?</summary>

**Answer: Dar Mimosa → Shadow Cosmetics → Techcit → Atlas Capital.**

- ✅ Shadow’s footer was re-pointed from Atlas Capital to Techcit, and the new Techcit page inherits Atlas Capital as its next stop.
- ❌ Any chain where Shadow still points to Atlas Capital is the *pre-change* state.
</details>

<details>
<summary>5. One image in the `Project #14` folder was deliberately excluded. Which, and why?</summary>

**Answer: `747752902…n.jpg` — a Ronica BeautyClub brand board that doesn’t belong to the Techcit project.**

- ✅ Its filename prefix (`7477…`) differs from the Techcit set (`707…`/`708…`) and its content is a different client’s beauty brand; publishing it under Techcit would misattribute work.
- ❌ “It was excluded for file size” — several included images are larger.
</details>
