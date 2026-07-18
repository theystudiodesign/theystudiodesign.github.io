# Explainer — Editorial pass (visible craft upgrades)

## Background

The previous polish pass (see `EXPLAINER-final-polish.md`) was deliberately invisible: SEO, social cards, structured data, accessibility and performance. This pass is the opposite — a set of **visible, Awwwards-level details**, all built from the existing token system so the THE'Y identity and Swiss voice stay exactly as designed.

## What changed, and why

### 1. Capability marquee (home, EN/FR/AR)
A slow edge-to-edge type band between Selected Work and Capabilities — the classic premium-studio signature (Studio Freight, Locomotive). Three identical segments + a `-33.333%` transform loop = seamless at any viewport width. Transform-only (compositor-friendly), pauses on hover, fully disabled under `prefers-reduced-motion`. Accent dots are the same 7px availability dot from the hero. `aria-hidden` — it is decoration.

### 2. Editorial index numbers on every project entry
`( 01 )`–`( 05 )` above each project title, on home and the Work index. Implemented with **pure CSS counters** — zero markup, works in all three locales, and because `display:none` elements generate no boxes, the numbering **auto-renumbers when the Work filters hide entries**.

### 3. Work-card hover choreography
The caption now answers the media zoom: the title block nudges 6px in the reading direction (mirrored in RTL) and the outcome line lifts from grey to full ink. Keyboard focus gets the identical treatment.

### 4. Studio plates (EN/FR/AR)
The two empty portrait placeholders on the Studio page ("TODO: replace with photo") are now a designed brand artefact: drafting-grid hairlines, a ghost `Y` at watermark opacity, studio coordinates (33.57° N · 7.59° W), GMT+1, Est. 2019. The page no longer has an "unfinished" moment; photography can replace the plates whenever it exists.

### 5. Footer CTA typography
"Have a project in *mind?*" — the last word turns serif-italic (the existing `.serif-accent` voice, same as "worldwide" in the hero), in all three languages.

### 6. Numbered mobile menu
The five destinations get small superscript mono indices (01–05) via CSS counters — scoped to `.mobile-menu > nav` so the language switcher is untouched.

### 7. Micro-interactions
- Testimonial rotator shows an editorial `01 / 03` counter between the arrows (JS-injected, aria-hidden).
- Theme toggle icon rotates 40° on hover.
- Case-study figures breathe (scale 1.03 over 1.1s) on hover, matching the work-card zoom language.
- Every `[id]` gets `scroll-margin-top: 96px` so anchor targets never hide under the fixed header (real UX fix for Capabilities → Services deep links and `#book`).

### Copywriting
Audited every heading and CTA across EN/FR/AR. The voice is already sharp and premium ("We publish only work we'd sign twice", "Deadlines are design") — rewriting it would risk i18n drift for zero gain. Kept, deliberately.

## Verification
- 12 pages × 3 viewports: no console errors, no page errors, no horizontal overflow
- axe-core WCAG 2.1 AA: 0 violations on all 10 audited pages
- RTL verified: marquee reverses direction, hover nudges mirror, plates translate
- Reduced-motion verified: marquee static, all reveals instant
- CSS brace-balanced, JS syntax-checked, cache-busted v53 → v54
