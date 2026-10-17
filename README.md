# Drafty Lab V2 — website (Phase 1 prototype)

Astro 5 + React islands + Tailwind 4. Spec: `DFL2_FULL_IMPLEMENTATION_SPEC.md`. Raw media lives one level up in `DFL2/` and is **never modified**; V1 is reference-only.

## Run

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # astro build + check:paths (fails on leaked local paths)
npm run preview        # serve dist
```

## Media pipeline (re-runnable, incremental)

```bash
npm run media:scan                 # scan DFL2 → media-src/manifest.internal.json (gitignored) + docs/asset-inventory.md, docs/unmapped-assets.md
npm run media:quality              # CRF test on sample clips → docs/encode-quality.md (CRFS=21,23 npm run media:quality to customise)
npm run media:build                # posters/images (WebP) for phases 1–2 + encode the "prototype" video set → src/data/media.public.json
npm run media:build -- --set=phase2   # raw/final + how-I-work videos
npm run media:build -- --set=all   # every video (done: 26 encoded)
npm run media:build -- --set=none  # manifest/posters only
npm run media:build -- --only=social-marie-v01,social-marie-v02
npm run media:posters              # docs/posters-review.html (open from disk)
npm run test:media                 # pipeline tests
npm run check:paths                # public manifest + dist must not contain machine paths / raw file names
```

- Internal manifest (`media-src/`, gitignored) holds absolute source paths; the frontend only imports `src/data/media.public.json` (relative `/media/v2/...` URLs).
- Generated media: `public/media/v2/` (MP4s gitignored). Encode presets: `scripts/encode-presets.json`; video sets: `scripts/media-sets.json`.
- `DFL2_DIR=/path/to/DFL2` overrides the source root.
- Ids are deterministic per brand + filename order; adding a file to a brand folder can shift later ids — re-run `media:build` after `media:scan`.

## Tests

```bash
npx playwright install chromium webkit   # once
npm run build && npm run test:e2e        # starts `astro preview --port 4322`
node tests/shoot.mjs                     # review screenshots → docs/screenshots
```

## Phase 3 (local only so far — 3A)

```bash
npm run test:unit            # validator, lead handler (real SQLite), media/Range handler
npm run check:functions      # type-check Pages Functions
npm run build:deploy         # dist/ without the 583 MB of videos + _headers (CSP hashes); videos → dist-r2/
npm run media:upload         # DRY RUN listing of what would go to R2 (never uploads without --execute)
npm run build:lead && npm run lead:local-r2 && npx playwright test --project=lead-live   # workerd + local D1/R2
```
Functions live in `functions/`, D1 schema in `migrations/`, Cloudflare config in `wrangler.toml` (placeholders until 3B), steps for the owner in `docs/deployment-checklist.md`.

## Structure

- `src/scripts/dialog-bootstrap.js` — inline script; one static dialog shell opens on the first click (before hydration); React (`MediaDialogHost`, `client:load`) renders controls/form into it.
- `src/components/react-bits/` — React Bits sources (local edits marked `DFL2:`), see `docs/react-bits.md`.
- `src/components/interactive/` — Social rail/cards, Quick Call form, Hero wrappers.
- `src/data/content.ts` — all copy. `src/data/brands.ts` — brand links (temporary from V1).
- `docs/` — audit, inventory, gesture notes, test report, screenshots.

Status: Phase 1 and Phase 2 approved (mapping kept as in `docs/phase2-mapping.md`). Website & Landing Page is not rendered (no assets). Still not done: lead backend (form is an honest DEMO), R2 upload, deploy (Phase 3 — not started, needs explicit approval).
