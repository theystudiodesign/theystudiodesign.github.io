# THE'Y — Internationalization (i18n) Explainer

## Background
The Phase-1 site is hand-written static HTML on GitHub Pages — no framework, no build step, EN only. This sprint adds French and Arabic (RTL) without changing that nature: the deliverable is still plain static files.

## Intuition
**English pages remain the single source of truth.** A small committed generator (`tools/i18n/build.py`) does three things: (1) injects the language switcher + hreflang into the EN pages, (2) generates `/fr/*` and `/ar/*` by applying translation dictionaries (`tools/i18n/fr.py`, `tools/i18n/ar.py`) to the EN HTML — longest-string-first so structure is never touched by hand twice, and (3) emits the localized `sitemap.xml`. Editing flow: change EN → update dict keys → `python3 tools/i18n/build.py` → commit output.

RTL is **deliberate, not mirrored**: one shared `main.css` gains a scoped layer — `html[lang=ar]` swaps the type stack (IBM Plex Sans Arabic + Amiri; no italics, no letter-spacing, taller leading) and `[dir=rtl]` flips only what reading direction demands (scroll cue, arrow nudges, underline origins). LTR islands are preserved: the THE'Y wordmark, clock, email, and metric numerals. Arrows in Arabic content are swapped (→↔←) by the generator.

## Code
- `tools/i18n/build.py` — generator (EN injection, locale generation, arrow swap, sitemap)
- `tools/i18n/fr.py` / `ar.py` — META (title/description per page) + STRINGS dictionaries
- `assets/css/main.css` — §24 switcher, §25 RTL/Arabic layer; two properties converted to logical (`text-align:end`, `border-inline-start`)
- `fr/`, `ar/` — 7 generated pages each; EN pages updated in place (switcher, hreflang, canonical untouched)

## Verification
27 routes HTTP 200 · switcher round-trip preserves the current page (EN→FR→AR→EN on /services/) · canonical + hreflang (en/fr/ar/x-default) verified · RTL assertions (dir, Arabic font active, labels letter-spacing 0, flipped scroll cue, LTR clock) · cross-locale link crawl 24 targets 0 broken · zero console/JS errors across locales × 2 viewports · sitemap XML validated. Screenshots: `docs/qa-i18n/`.

## Scope decisions (flagged, reversible)
Case studies stay EN in v1 (sample content pending real projects) — FR/AR work indexes link to them; 404 stays EN with switcher; Arabic voice is professional MSA; Arabic fonts are free Google Fonts pending a licensing decision.
