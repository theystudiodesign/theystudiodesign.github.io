# Explainer — Removing the demo projects & the self-curating home page

## Background

### The site, from the top (skip if you know it)

`theystudiodesign.github.io` is a **static, hand-written HTML site** for THE'Y Studio Design, served by GitHub Pages under `theystudiodesign.com`. No build step, no framework: each page is a complete HTML document; shared chrome is copy-pasted. One stylesheet (`assets/css/main.css`) and one script (`assets/js/main.js`) power everything. The site is trilingual — EN at the root, FR under `/fr/`, AR under `/ar/` — and each language has its own home page and Work index, while case-study pages exist only in English.

When the site was first built, three **demo projects were invented as scaffolding**: *Atlas Capital* (finance), *Noor Skincare* (e-commerce) and *Dar Mimosa* (hospitality). They had case-study pages made entirely of placeholder blocks (`.ph` tiles with text marks like “AC—25” — no photography), cards on the Work index, hero slots on the home page, invented testimonials in the “Why clients stay” carousel, and a fake client list on the Studio page. Since then, five **real** case studies with real project photography have shipped: Shadow Cosmetics, Techcit, Priscy Skin Care, Mira Beauty and Almeida Quiami Building.

### The part relevant to this change

The case studies are chained: each page ends with a “Next case study” link, forming a loop. Before this change the loop was *shadow → techcit → priscy → mira → almeida-quiami → atlas → noor → mimosa → shadow*. The home page's “Selected work” section was still hard-coded to the three demo projects, as were the testimonials and the Studio client roster. There is no search index, no JSON route table, and the service worker (`sw.js`) is a self-destructing cache cleaner with no precache list — so the demo projects' entire footprint is HTML pages, index cards, sitemap lines and the next-project chain.

## Intuition

Two moves, one commit.

**Move 1 — demolition.** Delete everything the three demo projects ever touched: their `work/<slug>/` pages, their cards on all three Work indexes, their three sitemap `<url>` lines, their invented quotes on all three home pages, their names on all three Studio client rows, and their links in the next-project chain (which re-closes as *shadow → techcit → priscy → mira → almeida-quiami → shadow*). Dar Mimosa was the only project tagged *Art Direction*, so the now-pointless “Art Direction” filter button is removed from the Work indexes too (the service anchor `/services/#art-direction` is untouched — that's an offering, not a project).

**Move 2 — a home page that curates itself.** The “Selected work” section is rebuilt with real projects *twice over*:

1. **Statically** — the HTML now ships with the three strongest real case studies (Almeida Quiami Building as the full-width lead, Mira Beauty and Priscy Skin Care as the tall pair), using the same `logo.jpg` images as the Work index. No JS, no problem: the page is already real, premium and correct.
2. **Dynamically** — a small module at the end of `main.js` fetches the language's own Work index, keeps only *real* case studies (cards that link into `/work/<slug>/` **and** contain an actual `<img>` — placeholder tiles and the “your product here” teaser card have neither), ranks them against a curated quality order, and pours the top three into the static slots.

The consequence is the requirement, verbatim: **if a project is later removed from Work, Home replaces it automatically.** Remove the Almeida Quiami card from `/work/` and the home hero becomes Mira Beauty, the pair becomes Priscy + Techcit — no home edit, in any language, because each home fetches its own index (`/work/`, `/fr/work/`, `/ar/work/`) and therefore inherits its own translations.

A toy example of the ranking. Suppose the Work index lists `[shadow, techcit, priscy, mira, quiami]` and the curated order is `[quiami, mira, priscy, techcit, shadow]`. Every card gets the rank of its slug in the curated list (unknown slugs rank after all curated ones, in page order — so a future sixth project is automatically eligible without touching the script). Sort, slice three: `[quiami, mira, priscy]`. Delete quiami from the index and the same arithmetic yields `[mira, priscy, techcit]`.

## Code

### 1. Deleted (git rm)

`work/atlas-capital/index.html` · `work/noor-skincare/index.html` · `work/dar-mimosa/index.html`

### 2. Work indexes — EN/FR/AR

Three `<a class="work-entry" id="entry-{atlas,noor,mimosa}">…</a>` cards removed from each, plus the empty filter:

```html
<button class="filter-btn" data-filter="direction" aria-pressed="false">Art Direction</button>  <!-- removed -->
```

### 3. Home pages — EN/FR/AR

The section gains the wiring for the auto-curation and its three slots:

```html
<section … id="selected-work" data-featured-work data-featured-src="/work/"
         data-featured-chip="View case study →">
  …
  <a class="work-entry reveal" data-featured-slot href="/work/almeida-quiami/" …>
    <div class="media-fill" data-parallax><img src="/assets/img/almeida-quiami/logo.jpg" …></div>
```

FR points `data-featured-src` at `/fr/work/`, AR at `/ar/work/`, each with its own cursor-chip label. The three invented testimonials are replaced by the real quotes already published on the Mira Beauty, Almeida Quiami and Priscy case-study pages (translated for FR/AR).

### 4. The auto-curation module (`assets/js/main.js`)

Appended as an independent IIFE, ~50 lines. The heart of it:

```js
var PRIORITY = ["almeida-quiami", "mira-beauty", "priscy-skincare", "techcit", "shadow-cosmetics"];
…
var real = all.filter(function (a) {
  return slugOf(a) && a.querySelector(".work-media img");   // real photo, real case-study URL
});
var ranked = real.map(function (a, i) {
  var p = PRIORITY.indexOf(slugOf(a));
  return { a: a, r: p === -1 ? PRIORITY.length + i : p };   // unknown projects rank after curated ones
}).sort(function (x, y) { return x.r - y.r; });
```

The top three are written into the `[data-featured-slot]` anchors: href, image, title, outcome line and tags all come from the fetched Work card, so home and Work can never disagree. Failures (offline, fetch blocked) are swallowed — the static fallback *is* the same real work.

### 5. Studio pages — EN/FR/AR

The “Selected clients” row now reads *Almeida Quiami · Mira Beauty · Techcit · Shadow Cosmetics · & yours →* (translated), and the stale `TODO: replace with real client wordmarks` comment is gone — they're real now.

### 6. Chain & sitemap

`work/almeida-quiami/index.html` next-project → Shadow Cosmetics. Three `<url>` lines removed from `sitemap.xml`.

## Verification

Automated, before the commit:

- **Zero leftovers** — a repo-wide grep for `atlas-capital|noor-skincare|dar-mimosa` and the display names (EN + AR script) across all `.html/.xml/.js/.json` returns nothing (historic `docs/` explainers excluded deliberately — they document past PRs).
- **`sitemap.xml`** parses as valid XML; **`main.js`** parses cleanly under Node.
- **Headless Chromium (Playwright), zero JS errors**, against a local server:
  - Home slots resolve to `/work/almeida-quiami/ | /work/mira-beauty/ | /work/priscy-skincare/` on EN, FR and AR.
  - **The replacement guarantee, proven:** with the fetch of `/work/` intercepted and the Almeida Quiami card stripped from the response, the home slots re-resolve to `/work/mira-beauty/ | /work/priscy-skincare/ | /work/techcit/`.
  - The Work index lists exactly the five real case studies + the packaging CTA card; filters are now `all, brand, digital, packaging`.

To QA manually:

1. Serve the repo root (`python3 -m http.server`) and open `/` — the Selected work section should show Almeida Quiami (wide), Mira Beauty and Priscy (tall pair), all with real photography; repeat on `/fr/` and `/ar/`.
2. Open `/work/atlas-capital/`, `/work/noor-skincare/`, `/work/dar-mimosa/` — all 404.
3. On `/work/`, confirm five real projects, no Art Direction filter; from Almeida Quiami's case study, “Next” should lead to Shadow Cosmetics.
4. Read the home testimonials — three real clients; check `/studio/` client row.
5. (Optional) Temporarily delete a card from `/work/index.html`, reload `/` — the home section heals itself.

## Alternatives

**A shared `projects.json` manifest driving both Home and Work**

| Pros | Cons |
|---|---|
| One source of truth; Home and Work literally cannot diverge | The Work index is hand-written HTML today — adopting a manifest means either duplicating data or client-rendering the Work page too, a much bigger change |
| Easy to extend with per-project metadata (scores, dates) | Adds a JSON schema to maintain on a site whose whole philosophy is “no build step, just HTML” |

**Purely static home (no JS), edited whenever Work changes**

| Pros | Cons |
|---|---|
| Zero moving parts; nothing to fetch or parse | Fails the explicit requirement — removing a project from Work would leave a dead link on Home until someone remembers to edit it |
| No risk of layout shift when JS swaps content | The status quo that caused this task: hard-coded cards silently rot |

## Suggested people to talk to

- **ELFASSI Karima** (`karima.elfassi@isiam.ma`) — wrote every real case study, the Work-index filter system and the home/`main.js` interaction patterns this change builds on; the right reviewer for both the deletions and the curation module.

## Quiz

<details>
<summary>1. How does the featured-work module distinguish a “real” project from a placeholder or teaser card?</summary>

**Answer: Two tests, both required.** The card's `href` must match `/work/<slug>/` (which excludes the “Your product here” card that links to `/contact/?service=packaging`), and the card's `.work-media` must contain an actual `<img>` element (which excludes placeholder `.ph` tiles that only hold a `<span class="ph-mark">`). Filtering by either test alone would let a fake through.
</details>

<details>
<summary>2. What happens on the home page if `fetch('/work/')` fails — say, the visitor is offline?</summary>

**Answer: Nothing visible.** The promise chain ends in a no-op `catch`, and the static HTML — which already ships the three strongest real projects with real images — simply stands. The module is progressive enhancement, not a dependency.
</details>

<details>
<summary>3. A sixth real case study ships next month but nobody updates the `PRIORITY` array. Can it ever appear on the home page?</summary>

**Answer: Yes.** Unknown slugs are ranked `PRIORITY.length + documentOrder` — after all curated projects, in Work-page order. It appears whenever fewer than three curated projects remain on the Work index; adding it to `PRIORITY` is only needed to rank it *above* existing projects.
</details>

<details>
<summary>4. Why was the “Art Direction” filter button removed from the Work index, but the `/services/#art-direction` link on the home page kept?</summary>

**Answer: Dar Mimosa was the only project tagged `direction`**, so after its removal the filter could only ever show an empty list — dead UI. The services link, by contrast, points at a service the studio still sells; it references no project.
</details>

<details>
<summary>5. Why does each language's home page fetch its own Work index (`/fr/work/`, `/ar/work/`) instead of all fetching `/work/`?</summary>

**Answer: Translations come free.** The FR/AR Work indexes carry translated outcome lines and tags (e.g. « Un a + Q tracé comme un plan… », «هوية بصرية»), and the module copies title/outcome/tags verbatim from the fetched card. Fetching the EN index would inject English copy into FR/AR homes. The case-study `href`s are identical everywhere, since case studies exist only in English.
</details>
