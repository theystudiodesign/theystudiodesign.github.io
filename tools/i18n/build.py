#!/usr/bin/env python3
# ============================================================
# THE'Y — i18n static generator (no framework, no runtime cost)
#
# EN pages are the single source of truth. This script:
#   1. injects the language switcher + hreflang into EN pages (in place)
#   2. generates /fr/* and /ar/* as plain static HTML from
#      translation dictionaries (tools/i18n/fr.py, tools/i18n/ar.py)
#
# Usage:  python3 tools/i18n/build.py        (from repo root)
# Re-run after any EN content change; commit the output.
# ============================================================
import os, re, sys, importlib.util

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://theystudiodesign.com'

# pages that exist in every locale (path relative to root, '' = home)
LOCALIZED = ['', 'work/', 'services/', 'studio/', 'contact/', 'privacy/', 'terms/']
# EN-only pages that still carry a switcher (mapped to nearest locale page)
EN_ONLY = {
    'work/atlas-capital/': 'work/', 'work/noor-skincare/': 'work/', 'work/dar-mimosa/': 'work/',
}
LOCALES = ['fr', 'ar']

def load(mod):
    p = os.path.join(os.path.dirname(__file__), mod + '.py')
    spec = importlib.util.spec_from_file_location(mod, p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

def read(p):  return open(os.path.join(ROOT, p), encoding='utf-8').read()
def write(p, s):
    fp = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, 'w', encoding='utf-8').write(s)

def hreflang_block(path):
    L = [f'<link rel="alternate" hreflang="en" href="{SITE}/{path}">']
    for loc in LOCALES:
        L.append(f'<link rel="alternate" hreflang="{loc}" href="{SITE}/{loc}/{path}">')
    L.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}/{path}">')
    return '\n'.join(L)

TOGGLE_ARIA = {'en': 'Toggle theme', 'fr': 'Changer de thème', 'ar': 'تبديل المظهر'}
def theme_toggle(active):
    return ('<button class="theme-toggle" type="button" data-theme-toggle '
            f'aria-label="{TOGGLE_ARIA[active]}">'
            '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
            'stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/>'
            '<path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/></svg>'
            '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<path d="M20.2 14.2A8.2 8.2 0 1 1 9.8 3.8a6.8 6.8 0 0 0 10.4 10.4Z"/></svg></button>')

FOUC_GUARD = ("<script>(function(){try{var t=localStorage.getItem('they_theme');"
              "if(!t&&window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches)t='light';"
              "if(t==='light'){document.documentElement.setAttribute('data-theme','light');"
              "var m=document.querySelector('meta[name=theme-color]');"
              "if(m&&m.content==='#0F0F0E')m.content='#F8F8F6';}}catch(e){}})()</script>")

def switcher(active, path):
    """path = locale-relative page path ('' | 'work/' | ...)."""
    items = []
    for code, href in (('en', f'/{path}'), ('fr', f'/fr/{path}'), ('ar', f'/ar/{path}')):
        cur = ' aria-current="true"' if code == active else ''
        items.append(f'<a href="{href}" lang="{code}" hreflang="{code}"{cur}>{code.upper()}</a>')
    return '<nav class="lang-nav" aria-label="Language">' + ''.join(items) + '</nav>'

# Arabic fonts: self-hosted (OFL) — preload the two weights used above the fold,
# small same-origin stylesheet loads normally (no third-party swap delay).
AR_FONTS = ('<link rel="preload" href="/assets/fonts/IBMPlexSansArabic-300-arabic.woff2" as="font" type="font/woff2" crossorigin>\n'
            '<link rel="stylesheet" href="/assets/css/fonts-ar.css">')

def inject_switcher(html, active, path):
    sw = switcher(active, path)
    # head: apply saved/OS theme before first paint (no flash)
    html = html.replace('</head>', FOUC_GUARD + '\n</head>', 1)
    # header: switcher + theme toggle before the CTA pill
    html = html.replace('<a class="btn btn-primary header-cta"',
                        sw + '\n    ' + theme_toggle(active) + '\n    <a class="btn btn-primary header-cta"', 1)
    # mobile menu foot
    html = html.replace('<div class="mobile-menu-foot">', '<div class="mobile-menu-foot">\n    ' + sw, 1)
    # footer baseline: drop the static EN·FR placeholder, then anchor after the legal links
    html = re.sub(r'<span class="lang-switch">.*?</span>\s*</span>\n?', '', html, flags=re.S)
    html = re.sub(r'(<span class="legal">.*?</span>)',
                  lambda m: m.group(1) + '\n    ' + sw, html, count=1, flags=re.S)
    return html

def strip_existing_i18n(html):
    """makes the script idempotent on EN sources"""
    html = re.sub(r'<nav class="lang-nav" aria-label="Language">.*?</nav>\n?\s*', '', html, flags=re.S)
    html = re.sub(r'<button class="theme-toggle".*?</button>\n?\s*', '', html, flags=re.S)
    html = re.sub(r'<script>\(function\(\)\{try\{var t=localStorage\.getItem\(.they_theme.\).*?</script>\n?', '', html, flags=re.S)
    html = re.sub(r'<link rel="alternate" hreflang=[^>]+>\n?', '', html)
    return html

def update_en(path):
    f = (path + 'index.html') if path.endswith('/') or path == '' else path
    html = strip_existing_i18n(read(f))
    target = path if path in LOCALIZED else EN_ONLY.get(path, '')
    html = inject_switcher(html, 'en', target)
    if path in LOCALIZED:
        html = html.replace(f'<link rel="canonical" href="{SITE}/{path}">',
                            f'<link rel="canonical" href="{SITE}/{path}">\n' + hreflang_block(path))
    write(f, html)

def localize_links(html, loc):
    html = html.replace('href="/"', f'href="/{loc}/"')
    for p in LOCALIZED[1:]:
        html = html.replace(f'href="/{p}"', f'href="/{loc}/{p}"')
        html = html.replace(f'href="/{p}#', f'href="/{loc}/{p}#')
        html = html.replace(f'href="/{p}?', f'href="/{loc}/{p}?')
    return html

def apply_dict(html, d):
    for k in sorted(d, key=len, reverse=True):
        html = html.replace(k, d[k])
    return html

def generate(loc, mod, path):
    f = (path + 'index.html') if path.endswith('/') or path == '' else path
    html = strip_existing_i18n(read(f))
    # lang / dir
    if loc == 'ar':
        html = html.replace('<html lang="en">', '<html lang="ar" dir="rtl">')
    else:
        html = html.replace('<html lang="en">', f'<html lang="{loc}">')
    # head: canonical + og:url + hreflang + meta
    html = html.replace(f'<link rel="canonical" href="{SITE}/{path}">',
                        f'<link rel="canonical" href="{SITE}/{loc}/{path}">\n' + hreflang_block(path))
    html = html.replace(f'<meta property="og:url" content="{SITE}/{path}">',
                        f'<meta property="og:url" content="{SITE}/{loc}/{path}">')
    title, desc = mod.META[path]
    html = re.sub(r'<title>.*?</title>', '<title>' + title + '</title>', html, count=1, flags=re.S)
    html = re.sub(r'<meta name="description" content="[^"]*">',
                  f'<meta name="description" content="{desc}">', html, count=1)
    html = re.sub(r'<meta property="og:title" content="[^"]*">',
                  f'<meta property="og:title" content="{mod.OG.get(path, title)}">', html, count=1)
    html = re.sub(r'<meta property="og:description" content="[^"]*">',
                  f'<meta property="og:description" content="{desc}">', html, count=1)
    if loc == 'ar':
        html = html.replace('<link rel="stylesheet" href="/assets/css/main.css">',
                            AR_FONTS + '\n<link rel="stylesheet" href="/assets/css/main.css">')
    # links then switcher (switcher hrefs are absolute per locale, added after rewriting)
    html = localize_links(html, loc)
    html = inject_switcher(html, loc, path)
    # content
    html = apply_dict(html, mod.STRINGS)
    if loc == 'ar':
        html = (html.replace('→', '\x00').replace('←', '→').replace('\x00', '←')
                    .replace('↗', '↖'))
    write(f'{loc}/{f}', html)

def build_sitemap():
    """Localized sitemap: every URL once, with xhtml:link hreflang alternates
       for localized pages; EN-only case studies keep plain entries."""
    def alt(path):
        L = [f'    <xhtml:link rel="alternate" hreflang="en" href="{SITE}/{path}"/>']
        for loc in LOCALES:
            L.append(f'    <xhtml:link rel="alternate" hreflang="{loc}" href="{SITE}/{loc}/{path}"/>')
        L.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/{path}"/>')
        return '\n'.join(L)
    prio = {'': '1.0', 'work/': '0.9', 'services/': '0.9', 'contact/': '0.9', 'studio/': '0.7',
            'privacy/': '0.3', 'terms/': '0.3'}
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
           '        xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for path in LOCALIZED:
        for base in [f'{SITE}/{path}'] + [f'{SITE}/{loc}/{path}' for loc in LOCALES]:
            out.append(f'  <url><loc>{base}</loc><priority>{prio[path]}</priority>')
            out.append(alt(path))
            out.append('  </url>')
    for path in EN_ONLY:
        out.append(f'  <url><loc>{SITE}/{path}</loc><priority>0.8</priority></url>')
    out.append('</urlset>')
    write('sitemap.xml', '\n'.join(out) + '\n')
    print('sitemap.xml:', 3 * len(LOCALIZED) + len(EN_ONLY), 'URLs')

def main():
    for p in LOCALIZED + list(EN_ONLY):
        update_en(p)
    update_en('404.html')
    for loc in LOCALES:
        try:
            mod = load(loc)
        except FileNotFoundError:
            print(f'({loc}: no dictionary yet — skipped)')
            continue
        for p in LOCALIZED:
            generate(loc, mod, p)
        print(f'{loc}: {len(LOCALIZED)} pages generated')
    build_sitemap()
    print('EN pages updated:', len(LOCALIZED) + len(EN_ONLY) + 1)

if __name__ == '__main__':
    main()
