# Phase 3 — bước 3A (chỉ code + test local) — BÁO CÁO

Trạng thái: **xong 3A, dừng chờ duyệt.** Không có gì công khai: không `wrangler login`, không tạo tài nguyên Cloudflare, không upload R2 thật, không deploy, không đụng DNS/V1. Mọi lệnh wrangler đã chạy đều là `--local` (SQLite + R2 mô phỏng trên đĩa trong `.wrangler/`, đã `.gitignore`).

## Bạn chưa trả lời 10 câu hỏi — tôi đã dùng mặc định sau (đổi được, không chặn 3A)

| # | Câu hỏi | Mặc định đang dùng | Cách đổi |
|---|---|---|---|
| 1 | Nhận lead ở đâu | Luôn **lưu D1**. Thông báo là adapter cắm-rút: `LEAD_NOTIFY=resend` (email) hoặc `telegram` hoặc `none` (mặc định) | đặt biến/secret ở 3B; chưa chọn → chỉ lưu |
| 2 | Tên miền | Chưa có; CORS/Origin chỉ cho origin của chính site + `ALLOWED_ORIGINS` | biến `ALLOWED_ORIGINS` |
| 3 | Turnstile + D1, giữ 12 tháng | Đã làm theo đúng kế hoạch (Turnstile bật khi có `TURNSTILE_SECRET`; D1; câu chữ "tối đa 12 tháng" trên form) | — |
| 4 | Asset V1 tạm | Vẫn đánh dấu `temporaryFromV1`; **chặn trước khi lên tên miền chính** | trả lời ở 3C |
| 5 | Font | Chỉ Geist (OFL) | — |
| 6–8 | Copy nháp / chính sách / Website section | Giữ như Phase 2; dòng đồng ý + quyền riêng tư là **bản nháp** (`content.ts → quickCall.steps.contact.consent/privacy`) | sửa chữ |
| 9–10 | iPhone thật / cách deploy | Chưa quyết; checklist 3B viết cho `wrangler` thủ công | — |

## Đã xây

**Form gửi thật** (`functions/api/lead.ts` + `functions/_lib/*`)
- Validator **dùng chung client/server** (`src/lib/lead-schema.ts`, danh sách lựa chọn trong `src/data/lead-options.ts`) — không thể lệch nhau.
- Server: chỉ POST; bắt buộc `Origin` hợp lệ; `Content-Type: application/json`; payload ≤ 4 KB; whitelist lựa chọn; làm sạch ký tự điều khiển; SĐT chuẩn hoá (`+84…` → `0…`); honeypot (giả vờ thành công, không lưu); **Turnstile verify phía server** khi có secret; **rate limit 5 lần / 10 phút theo IP đã băm** (không lưu IP thô); **idempotent theo `requestId`** (gửi lại không tạo trùng, không báo trùng); kill-switch `LEAD_ENABLED=false`; lỗi 500 không lộ nội bộ và **không log dữ liệu cá nhân**.
- Lưu D1 (`migrations/0001_leads.sql`), thông báo Resend/Telegram chạy nền (`waitUntil`); thông báo lỗi **không làm mất lead** (`notify=failed`).
- UI: bỏ banner DEMO khi có `PUBLIC_LEAD_ENDPOINT`; thêm ô **đồng ý** + dòng quyền riêng tư; widget Turnstile tải lười ở bước 4 khi có `PUBLIC_TURNSTILE_SITEKEY`; thông báo riêng cho 400/403/429/503/500/mất mạng, nút "Thử lại" dùng lại **cùng `requestId`**; "Đã nhận yêu cầu liên hệ" chỉ hiện sau khi server trả 200 (không hứa đặt lịch).

**Video qua R2** (`functions/media/v2/[[path]].ts`)
- Cùng origin, GET/HEAD, **Range 206/416**, ETag/304, `Content-Type: video/mp4`, `nosniff`; chặn path traversal; tên file có **hash nội dung** ⇒ `Cache-Control: immutable` 1 năm. Không phải `.mp4` ⇒ chuyển cho static assets.
- Pipeline đổi tên **mp4, preview và poster/ảnh** thành `<id>-<kind>.<hash8>.<ext>`; 59 file hiện có được **đổi tên, không encode lại**. `media.public.json` đã trỏ tên mới.
- `npm run build:deploy` (`scripts/prepare-dist.mjs`): tách 26 video 720p (**583 MB**) ra `dist-r2/`; `dist/` còn **209 file / 28 MB** (không file nào > 25 MiB); sinh `dist/_headers` với CSP lấy **hash của đúng các inline script** trong HTML.
- `scripts/upload-media.mjs`: **mặc định dry-run** (liệt kê key, kích thước, sha256); `--execute --local` (mô phỏng); `--execute --remote` bắt buộc thêm `--bucket` + `--confirm-bucket` trùng tên và **từ chối bucket V1**.

**Headers / routes**: `deploy/headers.template` (nosniff, Referrer-Policy, Permissions-Policy tắt camera/mic/geo, COOP, X-Frame-Options DENY, CSP **Report-Only**, cache immutable cho `/_astro/*` và `/media/v2/*`, HTML `must-revalidate`); `public/_routes.json` chỉ gọi Function cho `/api/*` và `/media/v2/*`.

## Kiểm thử (tất cả local)

| Bộ | Kết quả |
|---|---|
| `npm run test:unit` — validator, lead handler (SQLite thật), media handler (Range) | ✅ **25/25** |
| `npm run test:media` — pipeline | ✅ 13/13 |
| `npm run check:functions` + `astro check` | ✅ 0 lỗi |
| Playwright 4 project như cũ (Chromium/WebKit desktop+mobile) | ✅ **99 pass**, 13 skipped, 0 fail |
| Playwright `lead-live` — **workerd + Pages Functions + D1/R2 local**, site build không chứa video | ✅ **8/8** |

`lead-live` kiểm tra thật qua HTTP/trình duyệt: form → lưu D1 (đúng cột, `needs` JSON, `notify=skipped`); consent bắt buộc; 403 origin/thiếu Origin, 415, 413, 400 (không echo dữ liệu), honeypot, 405, idempotent retry; rate-limit 429 + `Retry-After: 600`; thông báo cho 400/403/429/503/500/abort và nút Thử lại; retry dùng cùng `requestId`; HEAD/GET/Range 206/416/404 cho video từ R2 + **video phát được trong lightbox từ Function**; poster là static; headers + hash CSP khớp HTML; **0 vi phạm CSP** trong một lượt dùng đầy đủ (scroll, hover preview, lightbox, Folder, Quick Call, Dot Grid/Lanyard).

Phát hiện & sửa khi test: placeholder CSP bị thay nhầm vào dòng chú thích (→ header lỗi `__CSP__`); `tsconfig` gốc quét nhầm code Workers; `crypto`/`node:sqlite` cho test; hash cho poster để không phải cache ảnh cũ.

## Chưa làm / không thể làm ở 3A
- **Turnstile thật** (cần site key/secret của bạn, và mạng tới `challenges.cloudflare.com`): server-side đã test bằng mock; widget chưa chạy thật → kiểm ở 3C bằng key test của Cloudflare rồi key thật.
- **Gửi email/Telegram thật**: chỉ test bằng mock (`fetch` giả).
- **CSP đang ở chế độ Report-Only**; chuyển sang enforce chỉ sau khi xem preview thật.
- **Không có iPhone/Android thật** → iOS/Android **NOT TESTED ON REAL DEVICE**.
- Hiệu năng/Lighthouse trên URL thật: 3C.

## Chạy lại
```bash
npm run test:unit && npm run test:media && npm run check:functions
npm run build && npx playwright test                 # 4 project như cũ
npm run build:lead && npm run lead:local-r2          # site production-like + video vào R2 *local*
npx playwright test --project=lead-live              # workerd + D1/R2 local
npm run media:upload                                  # dry-run (không gửi gì)
```
