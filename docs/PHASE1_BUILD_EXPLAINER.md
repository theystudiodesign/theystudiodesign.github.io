# THE'Y Studio Website — Phase 1 Build Explainer

*Sprints 1 & 2 · branch `claude/website-phase1-…` · July 2026*

---

## Background

### The deep background (skip if you know the repo)

This repository is a **GitHub Pages site** served at `theystudiodesign.com` (see `CNAME`). For most of its life it hosted two things: a "coming soon" landing page at `/`, and a substantial client-management PWA at `/gestion` — a single-file app that accumulated twenty sprints of features, a Supabase cloud-sync layer, and eventually a class of persistence bugs (storage quotas, multi-tab races, service-worker cache zombies) that consumed weeks of diagnostic work.

On 14 July 2026 a decision was made: the CRM was **removed from `main` entirely** and archived on the branch `archive/gestion-last-version` (tag `v1.0-backend-stable`). What remained on `main` was just the placeholder landing page and a **self-destructing service worker** (`sw.js`) whose only job is to delete old caches and unregister itself on any returning visitor.

### The narrow background

With the slate clean, a **Website Blueprint (Phase 1)** was written: a complete architecture and creative-direction document for a premium studio website — sitemap, user journey, homepage wireframe, a 10-section case-study system, services/studio/contact page structures, a design-language token system (§9), and a roadmap that deliberately reserves future modules (portal, booking, journal) for subdomains so the marketing site **never needs auth, a database, or a service worker again**.

This build implements that blueprint in two sprints:

- **Sprint 1** — the foundation: design tokens, base components, header/footer, the homepage, the 404 page.
- **Sprint 2** — the inner pages: work index, three case studies, services, studio, contact, legal pages, robots/sitemap.

## Intuition

The core intuition: **the blueprint's §9 "Design Language" is not documentation — it is the first deliverable.** Everything else is consumption of it.

Concretely, the entire visual system lives in one CSS file as custom properties:

```css
:root {
  --ink-950: #0F0F0E;   /* the brand's home surface */
  --paper-50: #F4F3F0;  /* case-study reading surface */
  --accent:  #E8FF47;   /* ONE signal color, <5% of any viewport */
  --ease-out: cubic-bezier(.22, 1, .36, 1);  /* the signature curve */
  --section: clamp(96px, 14vw, 240px);       /* whitespace as luxury */
}
```

A toy example of why this matters: the case-study pages read on a light "Paper" surface while the rest of the site lives on dark "Ink." Rather than writing light-mode styles, the case-study page does exactly one thing — `<body class="surface-paper">` — and the same components re-skin themselves because every component only ever references `--surface`, `--text-1`, `--line`:

```css
.surface-paper {
  --surface: var(--paper-50);
  --text-1: #111110;
  --line: rgba(17, 17, 16, .14);
}
```

The same philosophy governs the JavaScript: one dependency-free file where every behavior is a **seam, not a feature**. The contact form posts to an endpoint *if you configure one* and composes an email otherwise; the "Book a call" buttons open Calendly *if a URL exists* and fall back to email otherwise; analytics events fire into `window.THEY_ANALYTICS` *if a provider is wired* and no-op otherwise. Phase 2/3 plug in; nothing gets rebuilt.

> 💡 **Key concept — architectural seams (Blueprint §8.2):** the site is static and stateless by design. All lessons from the CRM era (storage quotas, sync conflicts, SW zombies) became *boundaries*: state belongs to future subdomain apps, never to this marketing site. The one stateful thing shipped is the *removal* of state — `main.js` unregisters any leftover service worker on every page load.

## Code

### Structure (13 routes, 2 assets)

```
/                     Home (Ink)             work/atlas-capital/   Case study (Paper)
/work/                Work index (Ink)       work/noor-skincare/   Case study (Paper)
/services/            Services (Ink)         work/dar-mimosa/      Case study (Paper)
/studio/              Studio (Ink)           /privacy/  /terms/    Legal
/contact/             Contact (Ink)          /404.html             Branded 404
assets/css/main.css   Tokens + every component (≈1000 lines)
assets/js/main.js     Every behavior, zero dependencies (≈500 lines)
```

Pages are plain static HTML with the header/footer repeated per page — no build step, no templating engine, no framework. This is deliberate: GitHub Pages serves it as-is, Lighthouse has nothing to slow it down, and the content model (§4.3) means a future move to a static-site generator is mechanical.

### Sprint 1 — the foundation

**Tokens & components** (`main.css`): the full §9 system — color, fluid type scale (`clamp(56px, 10.5vw, 160px)` for `display-xl`), the 8-pt spacing scale, radius/border/shadow rules, and the two easing curves. Components: pill buttons (primary/outline), underlined text links, project/service/metric cards, underline-style form fields, chips, FAQ accordions, the before/after slider, and the cursor chip.

**Header & navigation**: fixed slim bar that hides on scroll-down and reveals on scroll-up; background blur after 40px; active page marked with an accent dot (never an underline). Mobile gets the full-screen overlay with staggered oversized links — a brand moment, not a drawer.

**Footer** (§1.4): the oversized CTA block, the three columns with **live Agadir time** (`Intl.DateTimeFormat` with `Africa/Casablanca`, the IANA zone for all of Morocco, updating every 30 s), **copy-on-click email**, and the giant cropped `THE'Y` watermark that rises into view at page end.

**Homepage** (§3): all seven sections, including the two signature moments — the hero's masked word-stagger (80 ms/word) and the manifesto's scroll-linked ink reveal:

```js
/* words light up as you scroll through the statement */
var progress = (vh * 0.82 - r.top) / (r.height + vh * 0.35);
var lit = Math.round(progress * spans.length);
spans.forEach((s, i) => s.classList.toggle("lit", i < lit));
```

**Motion discipline**: only the blueprint's allowed vocabulary is implemented (masked reveals, clip wipes, ≤6% parallax, ≤8px magnetic pull, FLIP reorder, count-up once). `prefers-reduced-motion` collapses everything to simple fades — enforced globally in CSS *and* checked in every JS effect.

### Sprint 2 — the inner pages

**Work index** (§4.1): editorial header, text-toggle filters with a real **FLIP animation** (First-Last-Invert-Play — positions are measured before and after filtering, then elements animate the delta), large-format entries with outcome lines.

**Case-study system** (§4.2): one canonical 10-section template — hero with scrim, sticky meta bar doubling as a **reading-progress indicator** (which also fires the `case_study_read_depth` micro-conversion when the reader crosses 72%), Challenge → Strategy → Process (with "the direction we killed") → Solution → Results → before/after drag slider (pointer events + keyboard accessible) → brand-asset plates → next-project card. Three sample case studies populate it.

> ⚠️ **Edge case — the sample content:** the three case studies (Atlas Capital, Noor Skincare, Dar Mimosa) are **demonstration content** marked with HTML comments. The blueprint's honesty rule ("never fabricate numbers") applies to real clients; these exist to prove the template and must be replaced with real projects before launch (Definition of Done, item 5).

**Contact** (§7): split-screen with a sticky left panel; a **3-step conversational form** (service chips → budget/timeline chips → identity) with honeypot + time-trap anti-spam (never CAPTCHA), inline validation, a designed full-block success state, and the "what happens next" promise. The Services page's "Discuss this →" links prefill the form via `?service=`.

**SEO & plumbing**: canonical URLs, OG tags, `robots.txt` (which pre-emptively disallows the reserved `/portal` and `/book` paths), `sitemap.xml`.

## Verification

- **Syntax**: `node --check` on `main.js` — clean.
- **Routing**: all 13 routes return HTTP 200 under a local static server.
- **Browser QA** (Playwright/Chromium, 1440×900 and 390×844): every page loaded on both viewports with **zero console errors and zero page errors** (the only flagged resources were font-CDN loads blocked by the sandbox's TLS proxy — irrelevant in production).
- **Interaction tests, all passing**:
  - before/after slider drags to the expected clip position;
  - work filters show exactly the right entries (`digital` → Noor only) and FLIP back to all;
  - `?service=digital` prefills the correct chip;
  - submitting step 3 with empty fields is blocked (2 invalid fields flagged);
  - a legitimate submission (after the 3 s time-trap window) reaches the success state;
  - the mobile overlay opens and closes.
- **Screenshots**: `docs/qa/` holds desktop + mobile captures of every page from the QA run.

### Manual QA guide

1. Open a preview of the branch (or `python3 -m http.server` in the repo root) and load `/`. Watch for: hero words rising in sequence, the "Selected Work" images wiping in, the manifesto lighting up word-by-word as you scroll, numbers counting up once in "Why clients stay."
2. Scroll down then up — the header should hide, then return with a blur.
3. Click a project card → the case study opens on the light Paper surface; the thin accent line under the meta bar tracks your reading; drag the before/after slider.
4. Go to Services → click "Discuss this →" on a pillar → the contact form should have that service pre-selected. Complete all three steps; verify your mail client opens with the composed inquiry; the success block appears.
5. On a phone (or narrow window): open the menu — full-screen overlay, staggered links, local time at the bottom.
6. In the footer: click the email (it should copy and confirm), and check the Agadir clock is right.
7. Set your OS to reduce motion and reload — everything should appear instantly with no animation.

## Alternatives

**Alternative considered: a static-site generator (Eleventy/Astro) with templated partials.**

| Pros (vs. plain HTML) | Cons (vs. plain HTML) |
|---|---|
| Header/footer defined once, not per page | Adds a build step + Node toolchain to a repo that currently deploys by push |
| Case studies as Markdown/data files, closer to Blueprint §4.3 | GitHub Pages needs an Actions workflow to build; more deploy surface, more failure modes |
| Easier `/fr` locale generation later | The content model is already CMS-agnostic; migrating these pages into a generator later is mechanical |
|  | For 13 pages, template duplication is a bounded, visible cost |

The plain-HTML route was chosen to keep Phase 1 at **zero dependencies and zero build risk**; the generator remains the natural Phase 2/3 step once case-study volume or the FR locale demands it.

## Suggested people to talk to

Recent history on every touched file traces to a single author — **@theystudiodesign** (the studio itself), who wrote the placeholder landing page, the CRM, and its removal. For context on why the marketing site must stay stateless (the storage-quota and multi-tab history that motivated Blueprint §8.2.5), the archived branch `archive/gestion-last-version` and its `docs/` folder are the best written witnesses.

## Quiz

<details>
<summary><strong>1. A case-study page needs a light background while the rest of the site is dark. What is the intended mechanism?</strong></summary>

**A.** Add a `light.css` stylesheet to the page ·
**B.** Add `class="surface-paper"` to `<body>` ·
**C.** Use `@media (prefers-color-scheme)` ·
**D.** Inline styles per section

**Correct: B.** `.surface-paper` re-maps the surface/text/line tokens; every component re-skins automatically because components only reference tokens. A would duplicate the system; C keys off user OS preference, not editorial intent; D violates the token discipline.
</details>

<details>
<summary><strong>2. Why does <code>main.js</code> unregister service workers on every page load?</strong></summary>

**A.** To save battery ·
**B.** Because GitHub Pages forbids service workers ·
**C.** Returning visitors may still be controlled by the old CRM/placeholder SW and its caches; Phase 1 is deliberately stateless ·
**D.** To force fonts to reload

**Correct: C.** The previous era of this domain shipped service workers (up to v38); a cached zombie could serve stale content forever. Blueprint §8.2.5 makes "no SW" a boundary, and the cleanup enforces it for returning visitors. `sw.js` itself is also a self-destructing worker for anyone who still fetches it.
</details>

<details>
<summary><strong>3. What happens when the inquiry form is submitted 1 second after page load with the hidden "website_url" field filled?</strong></summary>

**A.** A validation error is shown ·
**B.** The success screen is shown but nothing is sent ·
**C.** A CAPTCHA appears ·
**D.** The submission is sent flagged as spam

**Correct: B.** Both the honeypot (filled hidden field) and the time-trap (<3 s) identify a bot; the form silently shows success without composing/sending anything — bots learn nothing, humans are never punished (§7.2 explicitly bans CAPTCHAs).
</details>

<details>
<summary><strong>4. The work-index filter animates entries to their new positions. How?</strong></summary>

**A.** CSS `transition` on `top`/`left` ·
**B.** A FLIP animation: measure positions before and after filtering, apply the inverse delta as a transform, then transition it to zero ·
**C.** The list is re-rendered with a keyframe animation ·
**D.** `scroll-behavior: smooth`

**Correct: B.** FLIP (First-Last-Invert-Play) lets the DOM change instantly (display:none on filtered-out entries) while surviving entries glide from their old to new positions — per Blueprint §4.1, "a smooth FLIP reorder, never a hard reload."
</details>

<details>
<summary><strong>5. Where would you change the site's accent color, and what constraint governs its use?</strong></summary>

**A.** Search-and-replace the hex across all HTML files; use it generously for brand presence ·
**B.** Edit `--accent` in `main.css` `:root`; it must occupy less than 5% of any viewport ·
**C.** Edit each button class; only buttons may use it ·
**D.** It cannot be changed without redesigning

**Correct: B.** One token defines it (currently `#E8FF47`, an explicit Phase-2 decision pending against the logo — Blueprint §9.1/Definition of Done item 2), and scarcity is the rule: accent on CTAs, active states, selection — never decoration.
</details>

---

*Open decisions intentionally left for the studio (Blueprint "Definition of Done"): accent color final call, typeface licensing (currently free Fontshare General Sans + Sentient standing in for the shortlists), EN/FR priority (built EN-primary, locale-ready), real case studies, the pricing anchor figure, the Calendly account, social handles, and a form endpoint.*
