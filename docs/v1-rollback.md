# V1 backup & rollback record (Phase 2, 2026-10-17)

No secrets in this file.

## Source backup (verified)
- Repo: https://github.com/thanhlone2k6/draftylab (public), default branch `main`
- V1 production commit: `6b0e34fb571779353a9fd039eaae2a85eba682dd` (tree `d2474b287b121356daa77481a93ac6ced8eb040d`)
- Created on GitHub (via API, no force, `main` untouched):
  - branch `backup-v1` -> same SHA (tree identical to `main`)
  - tag `v1-final-2026-10-17` -> same SHA
- Older restore tags already present: stable-2026-10-15, stable-2026-10-13, stable-2026-10-13-rail, stable-2026-10-13-loader
- History: 25 commits, no PRs, no GitHub Actions workflows, no webhooks. Deploys happen only via Cloudflare Pages Git integration.

## Cloudflare Pages `draftylab` (verified via wrangler)
- Git integration: yes; deployments come from branch `main`
- Current production deployment: `d9cbf25a-a557-44d3-9bfd-4c561ea3544b` (commit 6b0e34f), https://d9cbf25a.draftylab.pages.dev
- Previous good: `59a24a7b-5c7f-4eb9-862f-07c448eba40b` (95b6873), `3a815788-f752-487a-8263-2811f288ec28` (547f20c)
- Production secrets: none. R2 bucket used by V1 media: `draftylab-media` (do not touch).
- Dashboard Settings > Production (from user screenshots, 2026-10-17):
  - Git repo: thanhlone2k6/draftylab; production branch `main`; automatic deployments enabled
  - Build command `npm run build`; output `dist`; root directory empty; build comments enabled; build cache disabled; build system version 3; build watch paths include `*`
  - Variables: `NODE_VERSION` = `22` (text). No secrets. No bindings. No deploy hooks.
  - Runtime: placement Default; compatibility date 2026-10-10; no compatibility flags
  - Preview environment settings not captured (only Production was shown).
- Conflict to handle at cutover: the project has NO bindings and no `wrangler.toml`; DFL2 defines D1 `DB` and R2 `MEDIA_BUCKET` in `wrangler.toml`, which makes the dashboard Bindings read-only and replaces them on deploy. After cutover, rollback must restore "no bindings" (remove/rename wrangler.toml by reverting to backup-v1) and compat date 2026-10-10.

## Rollback
1. Fastest (no git): Dashboard > draftylab > Deployments > `d9cbf25a...` > "Rollback to this deployment".
2. Source: restore `main` from `backup-v1` (e.g. `git push origin backup-v1:main` with a reviewed fast-forward/revert commit, never deleting `backup-v1`), then Cloudflare redeploys.
3. Restore Dashboard build settings to the values recorded above once filled in.
