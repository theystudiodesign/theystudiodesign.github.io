# Explainer — Design Direction Fixes: masthead, language switcher, light accent & EN/FR/AR hero parity

## Background

### The system, from the top

The THE'Y marketing site is a deliberately framework-free static site. Every page is plain HTML; one stylesheet (`assets/css/main.css`) defines a **token system** — colors, type scale, spacing — at the top in `:root`, and every component below consumes those tokens. One small script (`assets/js/main.js`) adds progressive enhancements: scroll-reveals, the word-by-word hero animation, the theme toggle.

Three ideas matter for this change (skip ahead if you know the codebase):

1. **Tokens, not values.** The brand accent is declared once as `--accent: #E8FF47` (the lime). The hero punchline, the CTA fill, the status dot, focus rings — none of them know the color; they all say `var(--accent)`. Change the token, change the world.
2. **Themes are token remaps.** Dark is the default. `html[data-theme="light"]` doesn't restyle components — it re-declares the same tokens with light values. The same trick powers the "Paper" surface used by case studies.
3. **EN is the single source of truth for content.** `/fr/` and `/ar/` are *generated* by `tools/i18n/build.py`, which copies each EN page and applies an exact-string translation dictionary (`tools/i18n/fr.py`, `tools/i18n/ar.py`). You never hand-edit a generated page — you edit EN or the dictionary, then rebuild.

### What was wrong

The previous iteration (PR #32) had hand-edited the *generated* French and Arabic homepages instead of the dictionaries — so the system had silently drifted: re-running the generator would have wiped those translations back to English. On top of that, the design review found seven problems: a timid logo, a language switcher speaking a different typographic language than the nav, an illegible lime on light backgrounds, an outlined header CTA, and three heroes that wrapped differently per language — with Arabic actively broken (letter-spaced mono type tearing the connected script apart, and a Latin line-height crushing Arabic ascenders).

## Intuition

The fix rests on three small ideas:

**1. Let the browser do baseline math.** Instead of nudging the logo with a magic `top: -4.75px`, the header row now uses `align-items: baseline`. Flexbox aligns the *text baselines* of the wordmark (49px), the nav links (13.5px) and the language switcher (13.5px) exactly — at any font size, forever. Buttons and icons opt out with `align-self: center`. Toy example: put `<span style="font-size:49px">THE'Y</span>` and `<span style="font-size:13.5px">WORK</span>` in a baseline flex row — their letters sit on the same invisible line with zero arithmetic.

**2. A color is a role, not a value.** "Lime" is really the role *brand accent*. On ink it's `#E8FF47`; on warm white that value is unreadable (≈1.2:1). So the light theme re-declares the role: `--accent: #5A6600` — the same hue family driven dark enough for **5.9:1** contrast. Because every consumer references the token, the hero punchline, CTA, dots and borders all switch together. No component changed.

**3. Line breaks are authored, not accidental.** Three translations of one headline have three different lengths; letting them wrap naturally gave EN two lines, FR three, AR two-but-clipped. The headline now carries an explicit `<br>` per locale (`Brands that refuse<br>to be ignored.` / `Des marques<br>impossibles à ignorer.` / `علامات ترفض<br>أن تُتجاهل.`), the split animation preserves it, and one shared size — `clamp(52px, 8.6vw, 138px)`, tuned so the *longest* localized line fits — serves all three. Same scale, same two lines, same impact.

## Code

### 1 · Masthead (`main.css` §6)

Logo +40% and true baseline alignment:

```css
.header-inner { display: flex; align-items: baseline; ... }
.theme-toggle, .header-cta, .menu-toggle { align-self: center; }
.wordmark { font-size: 49px; /* was 35px; top-offset hack removed */ }
```

### 2 · Language switcher (`main.css` §24)

The header instance now speaks the nav's exact voice — same face, size (13.5px), tracking (.12em), case and padding — and the active language gets the same accent dot the nav gives the active page:

```css
.site-header .lang-nav a {
  font-family: var(--font-sans);
  font-size: 13.5px; letter-spacing: .12em; text-transform: uppercase;
  padding: 8px 0 4px;
}
.site-header .lang-nav a[aria-current="true"]::before { /* 4px accent dot */ }
```

Footer and mobile-menu instances keep their quiet mono style.

### 3 · Light accent (`main.css` §26 + Paper surface)

```css
html[data-theme="light"] {
  --accent: #5A6600;      /* 5.9:1 on #F8F8F6 */
  --accent-ink: #F6FFCF;  /* 6:1 on the accent — CTA text */
  --focus: #5A6600;
}
.surface-paper { --accent: #5A6600; --accent-ink: #F6FFCF; }  /* Paper is light in both themes */
```

### 4 · Always-filled primary CTA (`main.css` §6)

The outline override is deleted; `.header-cta` keeps its `btn-primary` accent fill in both themes and only adjusts size:

```css
.header-cta { padding: 12px 22px; font-size: 13.5px; font-weight: 500; }
```

### 5 · Hero parity (`index.html`, `main.css` §9b, `main.js`)

EN source gains the authored break; `data-split` now walks child nodes and re-emits `<br>` between animated lines:

```js
if (n.nodeType === 1 && n.tagName === "BR") lines.push([]);
...
if (li < lines.length - 1) el.appendChild(document.createElement("br"));
```

```css
.hero-v2 .hero-statement { max-width: none; font-size: clamp(52px, 8.6vw, 138px); }
```

### 6 · Arabic rebuild (`main.css` §25)

```css
html[lang="ar"] .display-xl { line-height: 1.16; }  /* same size; leading opens so the script renders */
html[lang="ar"] .hero-status { font-family: var(--font-sans); letter-spacing: 0; }  /* mono tracking was tearing ligatures apart */
```

### 7 · i18n integrity (`tools/i18n/fr.py`, `ar.py`)

Every hero-v2 string PR #32 had hand-patched is now a real dictionary entry (status line, kicker, sub with its `serif-accent` span, CTA note, three proof counters, AR clock). `/fr/` and `/ar/` were regenerated by `build.py` — the regeneration is **lossless** for the first time since hero v2 shipped.

## Verification

All checks ran against a local server with Playwright; screenshots live in [`docs/qa-design-direction/`](qa-design-direction/).

- **Programmatic, 3 languages × 2 themes × 1440px:** wordmark `49px` everywhere; nav and lang-switcher baselines equal (62.0 = 62.0); headline `123.8px`, exactly 2 lines, identical 1253px block width in EN/FR/AR; accent word = `#E8FF47` (dark) / `#5A6600` (light); header + hero CTAs accent-filled, `border: none`, both themes; AR status renders in IBM Plex Sans Arabic with zero letter-spacing; horizontal overflow 0.
- **Responsive:** 1024px — 2 lines, all languages, no overflow; 390px — consistent natural wrap, no overflow, logo unchanged.
- **Regression sweep:** 12 routes (all locales, services/work/contact, case study, 404) — split animation intact, zero JS errors.
- **Paper surface (light):** case-study progress bar and CTA both `#5A6600`.
- **No-JS fallback:** FR headline renders the authored two lines statically.
- **Contrast (computed):** `#5A6600` on `#F8F8F6` = 5.92:1 (AA all text); `#F6FFCF` on `#5A6600` = 6.03:1.

**Manual QA guide:**
1. Open the home page, toggle ☀︎/☾ — the CTA must stay filled and the punchline legible in both themes.
2. Switch EN→FR→AR from the header — the switcher should sit on the nav's baseline and each hero should show the same two-line composition with the last word accented.
3. Squint-test the three heroes side by side (`docs/qa-design-direction/side-by-side-*.png`).
4. Check `/ar/` closely — no disconnected letters anywhere above the fold.
5. Resize to 390px — nothing overflows.

## Alternatives

### A · JS "fit-to-width" headline sizing (auto-scale each locale's longest line)

| Pros | Cons |
|---|---|
| Every language fills the container edge-to-edge | Different computed font-size per language — violates the "same typography scale" rule |
| No per-locale copy/break tuning needed | Layout shift after JS runs; no-JS fallback diverges; more code to own |

### B · Keep lime in light mode, add a dark plate behind accent text

| Pros | Cons |
|---|---|
| The signature lime survives visually in light mode | Plates behind display type read as decoration, off-brand for the editorial system |
| No new color to govern | Doesn't fix dots/borders/small accents; contrast still fails wherever a plate is impossible |

## Suggested people to talk to

- **ELFASSI Karima** (`karima.elfassi@isiam.ma`) — author of most human commits on `assets/css/main.css` and the `tools/i18n/` generator; the best person for the token system's intent, the i18n build workflow, and whether the darker light-mode accent should be canonized in the brand guidelines.

*(The remaining recent commits on these files are AI-authored; there is no other human owner to consult.)*

## Quiz

<details>
<summary><b>1. Why does the language switcher now align with the main nav without any pixel nudging?</b></summary>

**Answer:** The header row uses `align-items: baseline`, and the switcher links were given the exact same font family, size and padding as the nav links. Flexbox aligns text baselines natively, so no `top:` offsets are needed — that's also why the 49px wordmark sits correctly. (A common wrong answer: "they share the same height" — baseline alignment is about text baselines, not box heights.)
</details>

<details>
<summary><b>2. A new component uses <code>color: var(--accent)</code>. What color is it on a case-study page in dark theme, and why?</b></summary>

**Answer:** `#5A6600` (the dark olive), not the lime. Case studies apply `.surface-paper` to the body, and that class now remaps `--accent`/`--accent-ink` because Paper is a light surface in *both* themes. Consistency comes from the token cascade, not from the theme attribute alone.
</details>

<details>
<summary><b>3. Why must FR/AR homepage changes go through <code>tools/i18n/fr.py</code> / <code>ar.py</code> instead of editing <code>fr/index.html</code> directly?</b></summary>

**Answer:** `/fr/` and `/ar/` are generated from the EN pages by `build.py` using exact-string dictionaries. Hand edits survive only until the next regeneration, then silently revert to English — exactly the drift this PR repaired by adding the missing hero-v2 dictionary entries.
</details>

<details>
<summary><b>4. What two separate defects made the Arabic hero look broken, and which fix addressed each?</b></summary>

**Answer:** (1) `.hero-status` inherited the mono font with `.1em` letter-spacing — added spacing disconnects Arabic's joined letters, so the status line looked shattered; fixed by an `html[lang="ar"]` override to the sans stack with zero tracking. (2) `.display-xl`'s Latin `line-height: .95` clipped Arabic ascenders/diacritics and collided the two lines; fixed by opening AR leading to 1.16 while keeping the identical font-size scale.
</details>

<details>
<summary><b>5. Why is the headline size <code>clamp(52px, 8.6vw, 138px)</code> instead of the old <code>clamp(56px, 10.5vw, 168px)</code>?</b></summary>

**Answer:** The scale is now shared and must fit the *longest authored line across all three languages* — FR's "impossibles à ignorer." At 10.5vw that line overflows or forces a third wrap at common desktop widths; 8.6vw is the largest factor at which all three locales hold the same two-line composition from 1024px up. Impact was equalized by sizing to the worst case, not the English best case.
</details>
