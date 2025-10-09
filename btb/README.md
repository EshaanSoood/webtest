# Static conversion plan for Ghost theme → GitHub Pages

## Goal

Turn the current Ghost theme into a static website for GitHub Pages that:
- Looks exactly like the Ghost site
- Has no dependency on Ghost server or database
- Lets you add new HTML/Markdown files in `reviews/` and `podcasts/` and auto-list them by date/category on the homepage

## Instructions for the coder

1) Extract the theme's front‑end
- Copy the visual/layout parts of the theme (HTML, CSS, images, fonts, icons)
- Strip Ghost template tags like `{{#foreach posts}}`, `{{content}}`, `{{@site.*}}`, etc.
- Replace with standard HTML or the chosen SSG's templating includes/loops

2) Pick a static site generator
- Use Jekyll (native on GitHub Pages) or Eleventy (11ty)
- Rebuild layouts with that system's templates so it auto‑generates listing pages and single pages
- Keep simple structure:
  - `reviews/` and `podcasts/` each with Markdown/HTML files that include front matter (`title`, `date`, `cover`, `artist`, `category`)

3) Make reusable templates
- One base layout with the theme's header, footer, typography, and Tailwind build
- One layout for reviews and one for podcasts (reuse post card styles)
- An index layout that lists newest items from both folders, showing cover art, title, and date

4) Migrate your content
- Export/copy posts from Ghost
- Put each item as its own Markdown/HTML file in `reviews/` or `podcasts/` with front matter
- Include: `title`, `date`, `artist`, `cover` image path, and optional `tags`

5) Recreate navigation and styling
- Reuse the exact navigation bar and link structure from the theme
- Keep the same color palette, fonts (Bebas Neue + Grobe Deutschmeister), spacing, and effects
- Confirm paths in CSS/images are relative so GitHub Pages renders correctly

6) Set up GitHub Pages
- Create a new GitHub repo
- Configure Jekyll or Eleventy to build on push
- Add a build script for Tailwind (or precompile CSS and commit it)

7) Add update workflow
- When you add a new file in `reviews/` or `podcasts/` and push to GitHub, the site rebuilds
- Homepage and listing pages automatically include the new content based on date/category

8) Test accessibility and loading
- Verify headings structure, link focus states, and alt text
- Ensure no Ghost helpers remain and that there's no unnecessary JS

---

If you want, I can write a short project brief (task checklist + design intent) the coder can use to implement and test before deployment.
