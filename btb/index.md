---
layout: default
title: Behind The Beat
---
<main id="site-main" class="site-main">
  <section class="hero px-4 md:px-6 py-8 md:py-12">
    <div class="hero-logo">
      <img src="{{ '/assets/images/btb-logo-clean.png' | relative_url }}" alt="{{ site.title }}" />
    </div>
    <div class="max-w-2xl">
      <h1 class="text-3xl md:text-5xl font-heading leading-tight text-purple-darkest">Heartfelt Reviews & Introspective Interviews.</h1>
      <p class="mt-3 md:mt-4 text-base md:text-lg text-purple-dark">A deep dive  into the albums and artists we truly love.</p>
    </div>
  </section>

  <section class="px-4 md:px-6">
    <div class="post-list">
      {% assign all = site.reviews | concat: site.podcasts %}
      {% assign sorted = all | sort: 'date' | reverse %}
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
            {% if item.category %}<span>•</span><a href="{{ '/' | relative_url }}{{ item.category | downcase }}/">{{ item.category }}</a>{% endif %}
          </div>
          {% if item.excerpt %}<p class="post-card-excerpt">{{ item.excerpt }}</p>{% endif %}
        </div>
      </article>
      {% endfor %}
    </div>
  </section>
</main>

