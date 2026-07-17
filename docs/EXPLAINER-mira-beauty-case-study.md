# Explainer — Mira Beauty case study (Project #9)

## Background

### The site, from the top (skip if you know it)

`theystudiodesign.github.io` is a **static, hand-written HTML site** for THE'Y Studio Design, served by GitHub Pages under the custom domain `theystudiodesign.com`. There is no build step, no templating engine, no framework: every page is a complete HTML document, and shared elements (header, footer, mobile menu) are copy-pasted into each file. One global stylesheet (`assets/css/main.css`) and one script (`assets/js/main.js`) power everything, loaded with a cache-busting query string (`?v=52`).

The site is trilingual. English pages live at the root (`/work/`), French under `/fr/`, and Arabic under `/ar/` (right-to-left, with its own font stylesheet). Each language has its own **work index** page listing case-study cards, but the case-study pages themselves exist only in English — the FR/AR indexes simply link across to `/work/<slug>/`.

Raw client project media is parked in `/projects/Project #N/` folders — straight exports with CDN-style filenames like `535688864_654210674365051_…_n.jpg`. These folders are the *inbox*; nothing on the site links to them directly.

### The part relevant to this change

Publishing a project means promoting it from the inbox to a case study — the pipeline established by Shadow Cosmetics (#1), Techcit (#14) and Priscy Skin Care (#8):

1. Copy the project's images to `assets/img/<slug>/` with **semantic names** (`logo.jpg`, `campaign.jpg`, `packaging.jpg`…).
2. Create a case-study page at `work/<slug>/index.html` with the fixed skeleton: hero → overview bar → challenge → strategy → process → solution → results → CTA → before/after slider → brand-assets grid → next-project link.
3. Add a work-entry card to all three work indexes (EN/FR/AR).
4. Add a `<url>` line to the sitemap and re-link the "next case study" chain.

> **Key constraint, carried over from Priscy:** every published image is a **byte-identical copy** of a file in `projects/Project #9/` — verified by MD5 checksum. No crops, no re-encodes, no substitutions.

## Intuition

Project #9 is **Mira Beauty** — a beauty/skincare brand whose identity is a double-stroke **B monogram cradled inside a crescent moon**, with a four-point spark where the moon opens, under the tagline *Deserve to Shine*. The palette pairs midnight forest green with chartreuse gold and cream. What makes Mira different from Priscy is its **screen life**: the folder contains not just packaging (elixir bottle, tube, dieline, hang tag, bag) but an app icon, an iPhone home-screen mockup, a sign-in UI and Instagram feed/story templates.

The core move is the same as the previous three case studies: *don't invent a new page design — instantiate the existing template with Mira's content*:

```
caseStudy(slug, images[11], copy, palette, nextProject) → work/<slug>/index.html
```

We call it with `slug = mira-beauty`, ten images chosen from the nineteen in the folder, copy written around the story visible in the mockups ("the moon that holds the light", one mark from 50 ml to 60 px), swatches sampled from the brand's own boards (`#12291B`, `#1E4631`, `#A9A85B`, `#C3C97A`, `#F3EFD5`), and `nextProject = Atlas Capital`.

A concrete example: `534889075_…_n.jpg` (the white lockup over the green-tinted campaign photo) becomes `assets/img/mira-beauty/logo.jpg` and is reused three times — as the work-index thumbnail in all three languages, as Fig. 01 in the strategy section, and as the "after" pane of the before/after slider.

Because Mira has a digital layer that Priscy didn't, the solution section grows one extra split: after the stationery + packaging figures, a short paragraph pivots ("Then the identity left the shelf…") and a second split shows the app icon and the Instagram templates. The card's `data-disciplines` gains `digital`, so Mira appears under the **Digital** filter as well as **Brand Identity** and **Label & Packaging**.

## Code

All changes live in one commit on `claude/mira-beauty-…`.

### 1. Ten images promoted from the inbox

| Source (`projects/Project #9/`) | Published as | Used for |
|---|---|---|
| `535688864_…_n.jpg` | `campaign.jpg` | Hero backdrop (hat portrait + lockup) |
| `534889075_…_n.jpg` | `logo.jpg` | Index card, Fig. 01, before/after |
| `535321407_…_n.jpg` | `monogram.jpg` | Fig. 02 — lockup system sheet |
| `535066679_…_n.jpg` | `pattern.jpg` | Fig. 03 — brand pattern + bag mockup |
| `533544111_…_n.jpg` | `stationery.jpg` | Solution — letterhead & cards |
| `535184851_…_n.jpg` | `packaging.jpg` | Solution — Luminous Skin Elixir |
| `535113467_…_n.jpg` | `dieline.jpg` | Solution — flat box dieline |
| `535090690_…_n.jpg` | `app.jpg` | Solution — app icon on home screen |
| `535534338_…_n.jpg` | `social.jpg` | Solution — Instagram templates |
| `534802361_…_n.jpg` | `grid.jpg` | System — brand board |

### 2. The case-study page

`work/mira-beauty/index.html` — "Case study — 07", following Priscy's exact section skeleton. The overview bar reads:

```html
<div><dt>Client</dt><dd>Mira Beauty</dd></div>
<div><dt>Sector</dt><dd>Beauty / Skincare</dd></div>
<div><dt>Year</dt><dd>2026</dd></div>
<div><dt>Services</dt><dd>Brand identity · Packaging · Digital &amp; social</dd></div>
<div><dt>Timeline</dt><dd>7 weeks</dd></div>
```

The swatch row in the system section carries the sampled palette:

```html
<span class="swatch" style="background:#12291B"></span>
<span class="swatch" style="background:#1E4631"></span>
<span class="swatch" style="background:#A9A85B"></span>
<span class="swatch" style="background:#C3C97A"></span>
<span class="swatch" style="background:#F3EFD5"></span>
```

### 3. Three work-index cards

The same card inserted between Priscy and the "Your product here" placeholder in `work/index.html`, `fr/work/index.html` and `ar/work/index.html`, with localized outcome lines:

- EN — *A moon holding a B → one shine from shelf to screen*
- FR — *Une lune qui porte le B → un même éclat du rayon à l'écran*
- AR — *هلال يحتضن حرف B ← بريق واحد من الرف إلى الشاشة*

Note `data-disciplines="brand packaging digital"` — one more filter than Priscy, because of the app/social layer.

### 4. Chain + sitemap

- `work/priscy-skincare/index.html`: the next-project link now points to `/work/mira-beauty/` (it used to point at Atlas Capital).
- `work/mira-beauty/index.html`: next-project → `/work/atlas-capital/` (the chain closes where Priscy's used to).
- `sitemap.xml`: one new line after Priscy's:

```xml
<url><loc>https://theystudiodesign.com/work/mira-beauty/</loc><priority>0.8</priority></url>
```

## Verification

- **Byte-identity:** `md5sum` on every file in `assets/img/mira-beauty/` matches its source in `projects/Project #9/` — all 10 checksums identical.
- **HTML well-formedness:** a Python `html.parser` tag-balance check over the new page and all four edited pages — all balanced.
- **XML validity:** `xml.etree.ElementTree` parses `sitemap.xml` without error.
- **Link/asset audit:** every internal `href`/`src` on the touched pages resolves to an existing file or `index.html`.
- **Browser QA (headless Chromium via Playwright):** loaded `/work/mira-beauty/` and `/work/` on a local server — hero, overview bar, solution splits and the new index card all render; zero JavaScript page errors.

To QA manually:

1. Run `python3 -m http.server` in the repo root and open `http://localhost:8000/work/mira-beauty/`.
2. Check the hero (hat portrait + "Case study — 07"), scroll through all seven sections, drag the before/after slider.
3. Open `/work/`, click the **Digital** filter — Mira Beauty should remain visible (as should Noor and Techcit); click **Label & Packaging** — Mira stays, Techcit disappears.
4. Open `/fr/work/` and `/ar/work/` — the Mira card should appear localized, linking to the English case study.
5. Open `/work/priscy-skincare/` and scroll to the bottom — "Next case study" should now be Mira Beauty.

## Alternatives

**Alternative: use the dark hat-portrait (`535688864`) as the index thumbnail instead of the wide green lockup (`534889075`).**

| Pros | Cons |
|---|---|
| More editorial, fashion-forward card | Breaks the established pattern where the card shows the *lockup* (Shadow, Techcit, Priscy all use `logo.jpg`) |
| Distinguishes Mira from Priscy's green card | The wordmark is smaller and harder to read at card size |

We kept the lockup thumbnail for consistency: the work index is a wall of *identities*, not photographs.

## Suggested people to talk to

- **ELFASSI Karima** (`karima.elfassi@isiam.ma`) — author/committer of the Shadow Cosmetics, Techcit and Priscy case-study merges (#56–#59), i.e. every previous run of this exact pipeline. Best person for questions about the case-study template, the trilingual index convention and the sitemap/next-project chain.

## Quiz

<details>
<summary>1. Why does the Mira Beauty card use <code>data-disciplines="brand packaging digital"</code> while Priscy's uses only <code>"brand packaging"</code>?</summary>

Because Mira's identity includes a digital layer — an app icon, a sign-in UI and Instagram templates — showcased in the case study's second solution split. The `digital` token makes the card appear under the work page's **Digital** filter. Priscy had no digital deliverables, so its card omits the token.
</details>

<details>
<summary>2. Which image is reused three times, and where?</summary>

`assets/img/mira-beauty/logo.jpg` (the white lockup over the green campaign photo). It appears as (1) the work-index thumbnail in all three languages, (2) Fig. 01 in the strategy section, and (3) the "after" pane of the before/after slider.
</details>

<details>
<summary>3. What changed in <code>work/priscy-skincare/index.html</code>, and why touch a file from a previous project at all?</summary>

Only its "next case study" footer link: it used to point to Atlas Capital and now points to Mira Beauty (Mira in turn points to Atlas Capital). Case studies form a linked chain, so inserting a new one means re-wiring the previous tail — exactly as the Priscy PR re-wired Techcit's.
</details>

<details>
<summary>4. The case-study page exists only in English. How do French and Arabic visitors reach it?</summary>

The FR and AR work indexes get their own localized *cards* (title, outcome line, alt text, cursor chip), but the card's `href` is the language-neutral `/work/mira-beauty/`. This is the site-wide convention: indexes are trilingual, case studies are English-only.
</details>

<details>
<summary>5. How was it verified that the published images are exactly the photos from Project #9?</summary>

By MD5 checksum: each file in `assets/img/mira-beauty/` was hashed and compared against its source in `projects/Project #9/`. All 10 pairs matched, proving the copies are byte-identical — no re-encoding, resizing or cropping happened along the way.
</details>
