# Explainer — THE’Y Studio final polish pass (site-wide audit)

## Background

### The system, from the top

THE’Y Studio Design’s site is a **hand-built static website** — no framework, no build step, no dependencies. Every page is a plain HTML file served by GitHub Pages under the custom domain `theystudiodesign.com`. The whole front-end is three files:

- `assets/css/main.css` — a single stylesheet organised as a token system (colors, type scale, 8-pt spacing, motion curves) followed by numbered component sections. Dark ink is the default theme; a warm-white light theme and a “Paper” surface for case studies re-declare the same tokens.
- `assets/js/main.js` — one dependency-free IIFE containing every behaviour: header hide/reveal, mobile menu, theme toggle, reveal-on-scroll animations, the multi-step inquiry form, page transitions, and a small second IIFE that mirrors the Work index into the home “Selected work” section.
- The HTML pages themselves — 27 of them, in three locales (EN at the root, FR under `/fr/`, AR under `/ar/` with full RTL), plus five English case studies under `/work/<slug>/`.

Because there is no templating layer, **every cross-cutting change must be applied to all 27 files** — which is why this change was executed with small scripts rather than hand-edits.

### The narrow background

The site was already in strong shape: consistent design tokens, reduced-motion support, hreflang alternates, a sitemap, lazy-loaded images. The audit therefore focused on the gaps a world-class studio site can’t afford: no social-share images, no structured data, ~7 MB of JPEG imagery with several 300–650 KB files, hover-only affordances invisible to keyboard users, and a handful of genuine layout bugs that only appear in specific states (the mobile menu, the hero CTA cluster, the footer columns).

## Intuition

The guiding idea: **polish is mostly subtraction and honesty, not addition.** Nothing new was designed; instead, every place where the site’s *intent* and its *actual rendering* disagreed was reconciled.

Three concrete examples:

1. **The mobile menu bug.** The CSS rule `.mobile-menu nav a { font-size: clamp(40px, 10vw, 72px) }` was written for the five big destinations — but the language switcher in the menu footer is *also* a `<nav>`, so EN/FR/AR rendered as three stacked 40-px monsters. The fix simply restores the switcher’s compact mono voice.
2. **Social cards.** Pasting `theystudiodesign.com` into Slack or LinkedIn produced a bare grey link. Now every page ships a 1200×630 `og:image` — a brand card that reproduces the exact header wordmark (General Sans 300 “THE’” + 700 “Y”, 0.32 em tracking, ink `#0F0F0E`), and each case study shares its own logo lockup, cover-cropped to the same frame.
3. **Bytes nobody sees.** A 639 KB aerial photo was being shipped to phones to fill a ~630-px column. Converting the 11 heaviest case-study images to WebP (and capping that one at 1600 px) removed ~1 MB — about 23 % of the case-study image payload — with no visible quality change.

## Code

### 1. SEO, social & structured data (all 27 pages)

Every page’s `<head>` gained a complete social block after `og:url`:

```html
<meta property="og:site_name" content="THE’Y Studio Design">
<meta property="og:locale" content="en_US">  <!-- fr_FR / ar_MA per locale -->
<meta property="og:image" content="https://theystudiodesign.com/assets/img/og-default.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="…">
<meta name="twitter:card" content="summary_large_image">
```

JSON-LD structured data was added per page type: `Organization` + `WebSite` on the three home pages, `BreadcrumbList` + `CreativeWork` on each case study, and `FAQPage` on the three services pages (extracted from the live FAQ markup, so the schema can never drift from the visible answers). Every page also gained `apple-touch-icon`.

### 2. Performance

- **WebP conversion** — the 11 heaviest case-study images (200–639 KB JPEGs) re-encoded as WebP q82: **~1 MB saved**. Each was referenced from exactly one page, verified by grep before deletion.
- **LCP** — each case-study hero image is now preloaded with priority:

```html
<link rel="preload" as="image" href="/assets/img/almeida-quiami/site.webp" fetchpriority="high">
```

- **CLS** — every content `<img>` now carries explicit `width`/`height` (read from the actual files) plus `decoding="async"`.
- The home page’s featured-work mirror fetch moved into `requestIdleCallback`, and the manifesto ink-reveal scroll handler is now rAF-throttled like every other handler.

### 3. Accessibility

`axe-core` (WCAG 2.1 AA) now reports **0 violations on all 10 audited pages**. Beyond that, keyboard users get parity with mouse users — every hover-only affordance gained a `:focus-visible` twin:

```css
.work-entry:hover .media-fill,
.work-entry:focus-visible .media-fill { transform: scale(1.05); }

.cap-row:hover .go,
.cap-row:focus-visible .go { opacity: 1; transform: none; }
```

The menu toggle gained `aria-controls="mobile-menu"`, and the testimonial rotator pauses while hovered or focused, so nobody has a quote swapped mid-read.

### 4. Design polish

- **Mobile menu** — language switcher restored to its compact mono voice (see *Intuition*).
- **Hero CTA cluster** — `.hero-v2 .hero-actions` becomes a column, so “Replies within 24 hours” sits *beneath* the buttons as a caption instead of competing on their baseline.
- **Footer columns** — the spacing rule targeted a non-existent `h4`; it now targets the real `.label` elements, restoring the intended breathing room under *Sitemap / Socials / Contact*.

### 5. Housekeeping

Dead CSS deleted (`.measure-narrow`, `.hairline`, `.process-track`, `.lang-switch`, unused placeholder gradients, duplicated `transform-origin` declarations), stylesheet cache-busted `v52 → v53`.

## Verification

All QA ran against a local server with headless Chromium (Playwright):

- **12 pages × 3 viewports** (1440 / 834 / 390 px): zero console errors, zero page errors, zero horizontal overflow, zero HTTP errors.
- **axe-core WCAG 2.1 AA**: 0 violations on all 10 audited pages (home ×3 locales, work, case study, services, studio, contact, privacy, 404).
- **Internal link check**: every `href`/`src` on all 27 pages resolves to a real file.
- **JSON-LD**: every block parsed and validated; no stale references to the deleted JPEGs anywhere.
- JS syntax-checked with Node; CSS brace-balanced.

**Manual QA guide:**

1. Share the URL of any page (or case study) in Slack/LinkedIn — a branded 1200×630 card should appear.
2. Tab through the home page — work cards should zoom and capability rows should show “Explore →” exactly as they do on hover.
3. Open the mobile menu at 390 px — EN·FR·AR should be one small mono row under the big destinations.
4. Run Lighthouse on `/work/almeida-quiami/` — image bytes are ~1 MB lighter and the hero is preloaded.
5. Validate any case-study URL in Google’s Rich Results Test — Breadcrumb + CreativeWork should be detected; the services pages should show FAQ.

## Alternatives

### `<picture>` with JPEG fallback instead of plain WebP

| Pros | Cons |
|---|---|
| Keeps a JPEG for ancient browsers | WebP has been universal in every browser since 2020 |
| No repo deletions | Doubles the stored assets and adds markup noise to 5 pages |

Plain WebP replacement was chosen: simpler markup, smaller repo, zero real-world compatibility cost.

### A static-site generator (Eleventy etc.) instead of scripted bulk edits

| Pros | Cons |
|---|---|
| Head/footer changes become one template edit forever | A build step changes the entire deploy story of a deliberately zero-dependency site |
| Kills the 27-file duplication problem | Far outside the scope of a polish pass; risks regressions everywhere |

Declined for this pass — but if the site keeps growing pages, it’s the right future conversation.

## Suggested people to talk to

- **ELFASSI Karima** (`karima.elfassi@isiam.ma`) — author of essentially the whole site (33 of 37 commits): the design blueprint (§-numbered comments), the i18n system, the theme system. The best person to sanity-check the hero CTA and mobile-menu decisions against the original design intent.

## Quiz

<details>
<summary><strong>Q1 — Why did the language switcher render at 40 px+ inside the mobile menu?</strong></summary>

- **A.** A JS bug applied the wrong class — ❌ No JS involved.
- **B.** `.mobile-menu nav a` styles every `<nav>` inside the menu, and the switcher is also a `<nav>` — ✅ Correct: the display-scale rule was written for the destinations but matched the footer switcher too.
- **C.** The `clamp()` function has no upper bound — ❌ It clamps at 72 px.

</details>

<details>
<summary><strong>Q2 — Why do case studies get their own og:image instead of the brand card?</strong></summary>

- **A.** The brand card exceeds size limits — ❌ It’s 26 KB.
- **B.** A shared link should sell the <em>work</em>: each case study shares its client lockup, cover-cropped to 1200×630 — ✅ Correct.
- **C.** Twitter requires unique images per URL — ❌ No such requirement.

</details>

<details>
<summary><strong>Q3 — What prevents the FAQPage schema from drifting out of sync with the page?</strong></summary>

- **A.** It’s generated by extracting the Q&A from the live `<details>` markup, so the schema is built from what visitors actually read — ✅ Correct.
- **B.** A CI check compares them — ❌ There is no CI.
- **C.** Notion syncs the FAQ — ❌ Notion isn’t involved in the site.

</details>

<details>
<summary><strong>Q4 — Why add explicit width/height to images that already live in aspect-ratio boxes?</strong></summary>

- **A.** It’s required for WebP — ❌ No.
- **B.** It lets the browser reserve intrinsic space before CSS loads and in any context where the aspect-ratio box doesn’t apply, hardening the site against layout shift — ✅ Correct: dimensions make CLS-safety intrinsic to the markup instead of dependent on the stylesheet.
- **C.** SEO crawlers require it — ❌ They don’t.

</details>

<details>
<summary><strong>Q5 — Why was the featured-work fetch moved to requestIdleCallback?</strong></summary>

- **A.** It was throwing console errors — ❌ It worked fine.
- **B.** The fetch re-parses `/work/` only to <em>mirror</em> content that is already present as static HTML, so it deserves zero priority against fonts, hero paint and LCP — ✅ Correct: the static markup is a complete fallback.
- **C.** GitHub Pages rate-limits fetches — ❌ It doesn’t.

</details>
