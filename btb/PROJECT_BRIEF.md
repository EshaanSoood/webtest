### Instructions to Build the Static Version of *Behind The Beat*

* Create a static website from scratch that looks and feels exactly like our current Ghost theme.
* The site should not depend on Ghost or any backend system. Everything should be static files that can live entirely on GitHub Pages.

---

### Design and Structure

* Rebuild the same layout and visual design from the Ghost theme (same fonts, colors, spacing, navigation, and overall feel).
* The site should have a homepage, a reviews section, and a podcasts section.
* The homepage should automatically list all reviews and podcasts, with titles, dates, and thumbnails, sorted by newest first.
* Each review and podcast should have its own page that follows a consistent layout.
* Keep all the styles in simple CSS files (no heavy frameworks).

---

### Content System

* Set up the site so new content can be added by simply dropping an HTML file into a "reviews" or "podcasts" folder.
* When new files are added, the homepage and section pages should automatically show the new entries.
* Each review or podcast file should include basic details like title, date, cover image, and description.

---

### Accessibility and Performance

* Make sure everything is accessible (clean headings, alt text for images, keyboard-friendly navigation).
* Keep the site lightweight and fast-loading, with minimal JavaScript.

---

### Hosting and Workflow

* The entire site should be hosted on GitHub Pages.
* When a new HTML file or update is pushed to GitHub, the site should rebuild automatically.
* All assets (CSS, images, etc.) should use relative paths so they work correctly on GitHub Pages.
* No build tools or server setup should be required on my end - I should just be able to add files and push to GitHub.

---

### Summary of Goals

* Same look and feel as the Ghost theme.
* No Ghost dependencies.
* Easy to maintain by adding or editing HTML files.
* Fully static, accessible, and hosted on GitHub Pages.

---


