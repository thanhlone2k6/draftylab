# Drafty Lab — Website

Bilingual (VI/EN) landing page for **Drafty Lab**, an AI & Creative Production Studio.
Dark Cinematic Editorial, warm gold accent, static-first.

## Stack

- **Astro** (static output) — no SSR, no backend, no database
- **Tailwind CSS v4** (via `@tailwindcss/vite`) + custom design tokens in `src/styles/global.css`
- **GSAP** + ScrollTrigger — selective motion only
- **Cloudflare Pages Free** target

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # preview the built site
```

## Structure

```
src/
  components/     one file per section + Header/Footer
  data/
    content.ts    all bilingual copy (edit here — the site follows)
    projects.ts   portfolio manifest (poster, preview, aspect, tag)
  layouts/BaseLayout.astro   head, meta, i18n links, global scripts
  pages/
    index.astro   Vietnamese  → /
    en/index.astro English     → /en/
  scripts/motion.ts   GSAP enhancement layer
  styles/global.css   design tokens + base + components
public/
  media/          logo, hero reel, portfolio posters + hover clips
  fonts/          SVN-Gratelos Display (prototype; see note below)
  _headers        Cloudflare caching/security headers
```

## Editing content

- **Copy:** `src/data/content.ts` — every string is keyed by language.
- **Portfolio:** `src/data/projects.ts` — drop a poster in `public/media/work/`,
  then point `poster` (and optional `preview` hover clip) at it. `aspect` drives
  the masonry layout; `tag` maps to `content.*.work.tags`.

## Fonts

- **Display:** `SVN-Gratelos Display` is loaded from `/public/fonts` for the local
  prototype. Before a fully public launch, confirm the commercial web-embed licence
  or replace with a licensed equivalent. A full fallback stack keeps the site intact
  if the font is absent.
- **Body:** SF Pro is used through the system font stack only — it is never bundled
  or self-hosted (Apple licence).

## Contact form

The form posts to `formsubmit.co` and delivers to `thanhnguyenphotowork@gmail.com`.
On first submission FormSubmit sends a one-time confirmation email to that address —
approve it once to activate delivery.

## Deploy — Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20 or 22

Target URL: `https://draftylab.pages.dev`
