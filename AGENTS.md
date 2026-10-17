# Drafty Lab (DFL2) — hướng dẫn cho AI / lập trình viên

Website https://draftylab.pages.dev. Astro 5 + React islands + Cloudflare Pages Functions.
Repo: https://github.com/thanhlone2k6/draftylab. Thư mục làm việc: `/Users/thanhng/Documents/DFL2/website`.

## Quy trình push (QUAN TRỌNG)
- Nhánh `main` = website thật. Push lên `main` → Cloudflare Pages tự build (`npm run build:cf`) và deploy sau 2–3 phút. KHÔNG có deploy tay.
- Trước khi push: `npm run build:cf && npm run check && npm run check:functions && npm run test:unit` phải pass.
- Thay đổi lớn: tạo nhánh khác (`git checkout -b ten-nhanh`, `git push -u origin ten-nhanh`) → Cloudflare tạo bản xem thử `https://ten-nhanh.draftylab.pages.dev` (không gửi email lead, form Turnstile chỉ chạy nếu hostname đó được thêm vào widget Turnstile). Xem ổn mới merge vào `main`.
- Commit nhỏ, message rõ. KHÔNG force-push `main`. KHÔNG `git reset --hard` trên `main`.
- Chi tiết thao tác hằng ngày và dữ liệu: `docs/UPDATE-GUIDE.md`. Rollback: `docs/v1-rollback.md`.

## Cấm
- Không commit `.env`, `.dev.vars`, API key, token, secret. Secret chỉ đặt bằng `npx wrangler pages secret put TEN --project-name draftylab [--env preview]`.
- Không commit video `.mp4` lớn (chỉ các file `*-preview.*.mp4` nhỏ được phép). Video 720p nằm ở R2 bucket `draft2`, upload bằng `npm run media:upload`.
- Không xoá/đổi: R2 `draft2` và `draftylab-media`, D1 `draftylab-v2-leads` (dữ liệu lead), branch `backup-v1`, tag `v1-final-2026-10-17`, project Pages `draftylab-v2`, `dinhhouse-website`.
- Không tự đổi thiết kế/animation nếu chủ site không yêu cầu. Không dùng Ponytail skills.
- Không chạy lệnh làm thay đổi Cloudflare production (đổi build command, binding, xoá deployment) khi chưa được chủ site đồng ý.

## Cấu trúc nhanh
- `src/data/content.ts` — nội dung chữ; `src/pages`, `src/components`, `src/layouts` — giao diện.
- `functions/` — Pages Functions: `/api/lead` (form Quick Call → D1 + email Resend + Turnstile), `/media/v2/*.mp4` (đọc R2).
- `wrangler.toml` — nguồn cấu hình binding D1 `DB`, R2 `MEDIA_BUCKET`, biến không bí mật. `migrations/` — SQL cho D1.
- `deploy/headers.template`, `scripts/prepare-dist.mjs` — CSP + tách video lớn ra khỏi dist.
- `docs/` — báo cáo, kiểm thử, hướng dẫn.

## Lead / email
Lead lưu D1 (`leads`), email gửi `thanhnguyenphotowork@gmail.com` qua Resend (`LEAD_NOTIFY=resend` ở production; preview là `none`). Xem lead: lệnh trong `docs/UPDATE-GUIDE.md`.
