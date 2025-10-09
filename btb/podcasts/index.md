---
layout: default
title: Podcasts
permalink: /podcasts/
---
<main id="site-main" class="site-main px-4 md:px-6">
  <header class="tag-header">
    <h1 class="tag-title">Podcasts</h1>
  </header>
  <div class="post-list">
    {% assign sorted = site.podcasts | sort: 'date' | reverse %}
    {% for item in sorted %}
      <article class="post-card">
        {% if item.cover %}
        <a class="post-card-media" href="{{ item.url | relative_url }}">
          <img src="{{ item.cover | relative_url }}" alt="{{ item.title }}" loading="lazy" />
        </a>
        {% endif %}
        <div class="post-card-content">
          <h2 class="post-card-title"><a href="{{ item.url | relative_url }}">{{ item.title }}</a></h2>
          <div class="post-card-meta">
            <time datetime="{{ item.date | date: '%Y-%m-%d' }}">{{ item.date | date: '%B %-d, %Y' }}</time>
          </div>
          {% if item.excerpt %}<p class="post-card-excerpt">{{ item.excerpt }}</p>{% endif %}
        </div>
      </article>
    {% endfor %}
  </div>
</main>

