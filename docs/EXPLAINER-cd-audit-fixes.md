# EXPLAINER — Creative Director Audit Fixes (7.3 → production-ready)

*Scope: every item from the July 2026 senior-CD audit, executed in priority order with
live verification after each fix. Certified Lighthouse scores included (§Verification).*

## Background

THE'Y Studio's site is a fully static, trilingual (EN root / `/fr` / `/ar`) GitHub
Pages site: 27 hand-authored HTML pages sharing one stylesheet (`assets/css/main.css`,
cache-busted by a `?v=N` query) and one dependency-free script (`assets/js/main.js`).
There is no build step — what is committed is what ships.

Three subsystems matter for this change:

1. **The split-text hero.** Every page's `data-split` headline is exploded into
   per-word `<span class="reveal-word">` elements masked inside overflow-hidden
   lines; adding `.words-in` starts a staggered translate-up reveal. Webfonts
   (General Sans / Sentient) load asynchronously from Fontshare with
   `font-display: swap`.
2. **The case-study template.** Five studies share one anatomy: full-bleed hero
   (`.cs-hero`), meta bar, numbered figure sections, and a Before/After
   comparison. The "before" pane of that comparison was a placeholder
   (`.ph-mark` text such as "another beauty logo") inside an image-slider UI.
3. **Image delivery.** Case-study images were single fixed-size files
   (100–310 KB), mostly JPEG, with no `srcset` — a phone downloaded the same
   bytes as a 4K desktop.

## Intuition

> 💡 **The audit's core finding wasn't visual — it was evidentiary.** The design
> system is agency-grade; the *proof* poured into it looked provisional: fake
> "before" images, TODO comments, a stat the visible portfolio can't support.

Three ideas drive the fixes:

- **Never animate text in a font you don't have yet.** The hero glitch is a
  classic race: the reveal starts in the fallback font, the webfont swaps in
  mid-animation, and the masked line clips the re-metric'd glyphs — a "broken
  character" for a few seconds. The fix is a *gate*: preload the exact hero
  font files, and hold the reveal until `document.fonts.check()` confirms the
  element's own computed face is ready (capped at 1.2 s so a dead CDN can never
  hold the hero hostage).
- **Stop promising images you don't have.** A drag-slider semantically promises
  two images. When the "before" is a caption, the component itself is the lie.
  So the component changed: a static two-pane "The shift" grid — the *before*
  is designed typography on the studio's plate-grid language (the starting
  position in words), the *after* is the real delivered mark. Honest, and it
  ships today.
- **Make every claim self-qualifying.** "24 brands launched" now carries its own
  context ("Since 2019 · five documented as full case studies below") plus a
  footnote linking to Work — a 30-second diligence pass now *confirms* the copy
  instead of contradicting it.

## Code

**1. Hero font gate (`assets/js/main.js`)** — new `fontGate()` helper polls
`document.fonts.check(style weight 1em family)` derived from the element's own
computed style (locale-agnostic: AR heroes gate on IBM Plex Sans Arabic
automatically), 40 ms interval, 1.2 s cap:

```js
if (reduced) el.classList.add("words-in");
else fontGate(el, function () { /* rAF ×2 → .words-in */ });
```

**2. Hero font preloads (all EN/FR pages)** — the two faces used above the fold
(General Sans 300, Sentient italic) are preloaded from Fontshare's CDN, plus a
`preconnect` to `cdn.fontshare.com` that was missing:

```html
<link rel="preload" href="https://cdn.fontshare.com/wf/…/TW4….woff2"
      as="font" type="font/woff2" crossorigin>
```

**3. "The shift" component (5 case studies + CSS)** — replaces `.ba-slider`:

```html
<div class="shift-grid reveal-media">
  <div class="shift-pane shift-before">
    <span class="shift-tag">Before</span>
    <p class="shift-phrase">Beauty-aisle noise.</p>
    <p class="shift-note">One more soft-pink lookalike…</p>
  </div>
  <div class="shift-pane shift-after">
    <img src="…logo-1600.webp" srcset="…" alt="Mira Beauty lockup — …">
    <span class="shift-tag">After — a moon with a spark</span>
  </div>
</div>
```

**4. Stat reconciliation (home ×3 locales)** — `.proof-note` line inside the hero
proof row + `.proof-footnote` under the "Why clients stay" metrics, linking to
Work ("the full project list is available on request").

**5. Responsive WebP pipeline (40 images × up to 4 widths)** — every content
image converted to WebP at 640/1024/1280/1600 w; all `<img>` and LCP
`<link rel="preload" as="image">` tags rewritten with `srcset`/`sizes`
(`imagesrcset`/`imagesizes` on preloads). Originals removed; `og*.jpg` kept for
social crawlers. 1280 w exists specifically so DPR-3 phones (iPhone: 390 × 3 =
1170 px) stop pulling the 1600 w asset.

**6. Techcit hero recomposition** — hero is now the clean primary lockup;
the metro photo (with its in-photo ad copy) moved down-page as
"Fig. 01 — In the wild", where a poster carrying copy is contextually honest.

**7. Pricing (services ×3 locales)** — `≈ $ / €` equivalents under each DH pack
price, an indicative-rates note, and the anchor figure now reads
"5,000 DH (≈ $500 / €465)". *Bonus bug fix:* the FR and AR pricing paragraphs
were shipping untranslated English — now translated.

**8. Housekeeping** — both remaining TODO comments deleted; the "Your product
here" placeholder tile removed from Work ×3 locales (the Label & Packaging
filter already resolves to three real projects: Shadow, Priscy, Mira);
testimonial figcaptions now link to their verifiable case studies;
`.proof-footnote`/figcaption links underlined (fixes an axe `link-in-text-block`
finding); cache-busters bumped (`main.css?v=56`, `main.js?v=2`).

## Verification

- **Hero glitch:** 10 × cold loads, cache disabled, throttled network
  (600 kb/s / 120 ms RTT), fonts genuinely loading — the reveal never started
  before `document.fonts.check('300 1em "General Sans"')` was true; headline
  text intact every load. Desktop (1440), mobile (390×844) and AR/RTL heroes
  screenshot-verified.
- **Images:** every page crawled at desktop + iPhone-13 emulation with full
  scroll — 0 broken images, 0 console errors (external font-CDN TLS errors in
  the sandbox proxy excepted). Mobile network log confirms 1280 w WebP variants
  are fetched instead of 1600 w / 300 KB JPEGs.
- **Filters:** Work page "Label & Packaging" shows exactly
  `entry-shadow, entry-priscy, entry-mira`; "All" shows 5 entries.
- **Accessibility:** axe-core 4.10 (WCAG 2 A/AA) — 0 violations across
  home/work/services/studio/contact/case studies, EN + AR. Cursor chip is
  `aria-hidden`, all `[data-magnetic]` targets are native links/buttons with
  accessible names, first tab stop is the skip link. (A human VoiceOver/NVDA
  pass is still recommended — flagged below.)
- **Booking + form:** `[data-book]` opens the Cal.com URL in a new tab;
  3-step form renders with an active step.
- **Lighthouse 12 (headless Chromium, mobile emulation):**
  - Live production baseline: **Performance 99 · Accessibility 100 ·
    Best Practices 100 · SEO 100** (LCP 1.6 s, CLS 0.019, TBT 80 ms)
  - This branch on a local *uncompressed* server (pessimistic):
    93 / 100 / 96 / 100 (LCP 2.5 s, CLS 0)

**Manual QA:** hard-reload the homepage 10× with DevTools "Disable cache" — the
headline must never garble; open each case study and check the "The shift"
section (drag no longer exists — it's a static comparison); on a phone, confirm
Services shows "≈ $ / €" under each price; filter Work by Label & Packaging.

## Items that require the owner (not code)

1. **Cal.com branding (audit #2):** in cal.com → Settings → Profile, set the
   display name to "THE'Y Studio", upload the logo as avatar, and rename the
   event to an English title (e.g. "Discovery call — 30 min"). Optionally add
   per-locale event types. No code change can override the account's name.
2. **Real founder/studio photography (audit #3):** the marked TODO placeholders
   were already replaced by art-directed studio plates (commit `aeba…`/PR #70);
   swapping in real photographs when available is the remaining (highest-ROI)
   step.
3. **Testimonial names (audit #6):** real names need client permission — code
   now links each quote to its case study as interim verification.
4. **Far-future cache headers (audit #8):** GitHub Pages cannot set
   `cache-control`; front the domain with Cloudflare (free tier: Cache Rule
   `max-age=31536000, immutable` on `/assets/*`) or move to Netlify/Vercel.
5. **Form backend (audit #13):** formsubmit.co works; for guaranteed
   deliverability move to Formspree/Basin (static-friendly) or a serverless
   relay through Resend/Postmark. Static hosting cannot hold API secrets, so
   this needs either a paid form service or a small function.
6. **Human screen-reader pass (audit #14):** automated checks are clean; do one
   VoiceOver (Safari) + NVDA (Firefox) session over the home and contact pages.

## Alternatives

**Hero fix: preload-only (no JS gate)**

| Pros | Cons |
|---|---|
| Zero JS complexity | Fontshare CDN hiccup still garbles the reveal |
| One-line-per-page change | Doesn't cover AR pages' different font stack |

**Before/after: keep the slider, design a "generic before" mock image**

| Pros | Cons |
|---|---|
| Keeps a jury-friendly interaction | Fabricates a prior identity that never existed — worse than the caption |
| No new component CSS | The audit explicitly calls this pattern out |

## Suggested people to talk to

- **ELFASSI Karima** (karima.elfassi@isiam.ma) — authored the case-study
  template, the editorial pass that introduced the studio plates and marquee
  (PR #70), and the site-wide SEO/a11y polish (PR #69). She has the deepest
  context on the design-token system and the `?v=N` cache convention this
  change extends.

## Quiz

<details>
<summary>1. Why did the hero glitch only appear on cold loads?</summary>

Because on warm loads the webfonts come from cache and are ready before the
reveal's first frame; only a cold load leaves a window where the fallback font
starts the animation and the swap lands mid-reveal inside the overflow-hidden
line masks.
</details>

<details>
<summary>2. Why gate on the element's computed font instead of hard-coding "General Sans"?</summary>

The AR pages render their heroes in IBM Plex Sans Arabic. Deriving the probe
from `getComputedStyle(el)` makes the same gate correct in all three locales
with zero locale-specific code.
</details>

<details>
<summary>3. Why was a 1280 w image variant added on top of 640/1024/1600?</summary>

An iPhone at DPR 3 needs 390 × 3 = 1170 device pixels for a 100 vw image;
with only 1024/1600 available the browser must choose 1600. 1280 is the
smallest variant ≥ 1170, cutting mobile bytes without visible quality loss.
</details>

<details>
<summary>4. Why did the packaging filter fix require deleting a tile rather than adding work?</summary>

Three existing case studies (Shadow, Priscy, Mira) were already tagged
`data-disciplines="… packaging"`, so the filter already resolved to real
projects — the only unreal thing in that view was the "Your product here"
placeholder tile.
</details>

<details>
<summary>5. Which audit items are unfixable from the repository, and why?</summary>

Cal.com display name/event title (account data on cal.com), real founder
photography and testimonial names (require assets/permissions), and cache
headers (GitHub Pages doesn't allow custom headers — needs Cloudflare or a
different host).
</details>
