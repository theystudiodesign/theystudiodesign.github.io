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

def switcher(active, path):
    """path = locale-relative page path ('' | 'work/' | ...)."""
    items = []
    for code, href in (('en', f'/{path}'), ('fr', f'/fr/{path}'), ('ar', f'/ar/{path}')):
        cur = ' aria-current="true"' if code == active else ''
        items.append(f'<a href="{href}" lang="{code}" hreflang="{code}"{cur}>{code.upper()}</a>')
    return '<nav class="lang-nav" aria-label="Language">' + ''.join(items) + '</nav>'

AR_FONTS = ('<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;700'
            '&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">')

def inject_switcher(html, active, path):
    sw = switcher(active, path)
    # header: before the CTA pill
    html = html.replace('<a class="btn btn-primary header-cta"', sw + '\n    <a class="btn btn-primary header-cta"', 1)
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
    print('EN pages updated:', len(LOCALIZED) + len(EN_ONLY) + 1)

if __name__ == '__main__':
    main()
