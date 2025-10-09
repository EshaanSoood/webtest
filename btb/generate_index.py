#!/usr/bin/env python3
import os, re, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))

def parse_front_matter(path):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    if not text.startswith('---'):
        return {}
    parts = text.split('\n---', 1)
    if len(parts) < 2:
        return {}
    fm = parts[0].lstrip('-\n')
    data = {}
    for line in fm.splitlines():
        if not line.strip() or line.strip().startswith('#'):
            continue
        if ':' in line:
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip().strip('"')
            data[key] = val
    return data

def collect_items():
    items = []
    for coll, cat in [('_reviews', 'Reviews'), ('_podcasts', 'Podcasts')]:
        coll_dir = os.path.join(ROOT, coll)
        if not os.path.isdir(coll_dir):
            continue
        for fn in os.listdir(coll_dir):
            if not fn.lower().endswith('.md'):
                continue
            path = os.path.join(coll_dir, fn)
            fm = parse_front_matter(path)
            if not fm:
                continue
            date_str = fm.get('date') or '1970-01-01'
            try:
                date = datetime.datetime.strptime(date_str.strip(), '%Y-%m-%d')
            except Exception:
                try:
                    date = datetime.datetime.fromisoformat(date_str.strip())
                except Exception:
                    date = datetime.datetime(1970,1,1)
            items.append({
                'title': fm.get('title','Untitled'),
                'date': date,
                'date_disp': date.strftime('%B %-d, %Y') if os.name != 'nt' else date.strftime('%B %d, %Y').replace(' 0',' '),
                'category': fm.get('category') or cat,
                'cover': fm.get('cover') or '/assets/images/btb-logo-clean.png',
                # For now, static server can't render liquid pages; link to reviews/podcasts index
                'url': '/{}/'.format('reviews' if coll=='_reviews' else 'podcasts'),
                'excerpt': fm.get('excerpt') or ''
            })
    items.sort(key=lambda x: x['date'], reverse=True)
    return items

HTML_HEAD = '''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Behind The Beat</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" href="assets/images/btb-logo-clean.png">
    <link rel="apple-touch-icon" href="assets/images/btb-logo-clean.png">
    <link rel="stylesheet" href="assets/build/css/build.css">
    <link rel="stylesheet" href="assets/build/css/overrides.css">
  </head>
  <body>
    <header class="site-header">
      <div class="hidden md:flex items-center gap-[var(--nav-spacing)] py-2 px-3 text-purple-darkest">
        <a href="/" class="flex items-center" aria-label="Home">
          <img src="assets/images/btb-logo-clean.png" alt="Behind The Beat" class="h-[var(--nav-height)] w-auto" />
        </a>
        <nav aria-label="Primary" class="nav-row flex items-center gap-[var(--nav-spacing)]">
          <a href="/" class="nav-link is-active" style="--item-skew: var(--nav-skew-1);">Home</a>
          <a href="/mission/" class="nav-link" style="--item-skew: var(--nav-skew-2);">Mission</a>
          <a href="/reviews/" class="nav-link" style="--item-skew: var(--nav-skew-3);">Reviews</a>
          <a href="/podcasts/" class="nav-link" style="--item-skew: var(--nav-skew-4);">Podcasts</a>
          <a href="/contact/" class="nav-link" style="--item-skew: var(--nav-skew-5);">Contact</a>
          <a href="#" class="btn-trapezoid">Subscribe</a>
        </nav>
      </div>
      <div class="md:hidden py-2 px-3 text-purple-darkest">
        <div class="flex items-center">
          <a href="/" class="flex items-center" aria-label="Home">
            <img src="assets/images/btb-logo-clean.png" alt="Behind The Beat" class="h-[var(--nav-mobile-height)] w-auto" />
          </a>
        </div>
        <nav aria-label="Primary" class="nav-col flex flex-col gap-[var(--nav-spacing-mobile)] mt-2">
          <a href="/" class="nav-link is-active" style="--item-skew: var(--nav-skew-1);">Home</a>
          <a href="/mission/" class="nav-link" style="--item-skew: var(--nav-skew-2);">Mission</a>
          <a href="/reviews/" class="nav-link" style="--item-skew: var(--nav-skew-3);">Reviews</a>
          <a href="/podcasts/" class="nav-link" style="--item-skew: var(--nav-skew-4);">Podcasts</a>
          <a href="/contact/" class="nav-link" style="--item-skew: var(--nav-skew-5);">Contact</a>
        </nav>
      </div>
    </header>
    <main id="site-main" class="site-main">
      <section class="hero px-4 md:px-6 py-8 md:py-12">
        <div class="hero-logo">
          <img src="assets/images/btb-logo-clean.png" alt="Behind The Beat" />
        </div>
        <div class="max-w-2xl">
          <h1 class="text-3xl md:text-5xl font-heading leading-tight text-purple-darkest">Heartfelt Reviews & Introspective Interviews.</h1>
          <p class="mt-3 md:mt-4 text-base md:text-lg text-purple-dark">A deep dive  into the albums and artists we truly love.</p>
        </div>
      </section>
      <section class="px-4 md:px-6">
        <div class="post-list">'''

HTML_CARD = '''
          <article class="post-card">
            <a class="post-card-media" href="{url}">
              <img src="{cover}" alt="{title}" loading="lazy" />
            </a>
            <div class="post-card-content">
              <h2 class="post-card-title"><a href="{url}">{title}</a></h2>
              <div class="post-card-meta">
                <time datetime="{date_iso}">{date_disp}</time>
                <span>•</span><a href="/{cat_slug}/">{category}</a>
              </div>
              {excerpt_html}
            </div>
          </article>'''

HTML_TAIL = '''
        </div>
      </section>
    </main>
    <footer class="site-footer" role="contentinfo">
      <div class="site-footer-inner">
        <nav aria-label="Footer" class="footer-nav nav-row flex items-center gap-[var(--nav-spacing)]">
          <a href="/"           class="nav-link" style="--item-skew: var(--nav-skew-1);">Home</a>
          <a href="/mission/"   class="nav-link" style="--item-skew: var(--nav-skew-2);">Our Mission</a>
          <a href="/reviews/"   class="nav-link" style="--item-skew: var(--nav-skew-3);">Reviews</a>
          <a href="/podcast/"   class="nav-link" style="--item-skew: var(--nav-skew-4);">Podcast</a>
          <a href="/contact/"   class="nav-link" style="--item-skew: var(--nav-skew-5);">Contact</a>
        </nav>
        <div class="footer-legal">
          <p>© 2025 Behind The Beat</p>
          <p class="footer-credit">Vibe Coded by Eshaan Sood</p>
        </div>
      </div>
    </footer>
  </body>
</html>
'''

def build_index():
    items = collect_items()
    html = [HTML_HEAD]
    for it in items:
        excerpt_html = f'<p class="post-card-excerpt">{it["excerpt"]}</p>' if it['excerpt'] else ''
        html.append(HTML_CARD.format(
            url=it['url'],
            cover=it['cover'],
            title=it['title'],
            date_iso=it['date'].strftime('%Y-%m-%d'),
            date_disp=it['date_disp'],
            cat_slug=it['category'].lower(),
            category=it['category'],
            excerpt_html=excerpt_html
        ))
    html.append(HTML_TAIL)
    out = os.path.join(ROOT, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(html))
    return out

if __name__ == '__main__':
    out = build_index()
    print(f'Wrote {out}')


