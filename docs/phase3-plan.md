# Phase 3 — kế hoạch (3A đã xong — xem phase3-3a-report.md; 3B/3C/3D chờ bạn)

Phạm vi: (1) form Quick Call gửi thật, (2) đưa video lên R2, (3) deploy bản V2 riêng. Không đụng V1, không đổi DNS, không dùng tài nguyên Cloudflare của V1 (`draftylab`, bucket `draftylab-media`).

## 0. Hiện trạng (đã đo)

| Mục | Số liệu |
|---|---|
| `dist/` | 632 MB, trong đó **32 file mp4 = 607 MB** (lớn nhất ~66 MB); ảnh WebP ≈ 19 MB |
| Giới hạn Cloudflare Pages | **25 MiB / file** → mp4 720p **bắt buộc** ra khỏi `dist` (R2), poster/ảnh/preview (<2 MB) ở lại Pages |
| Form | UI + validate xong, chạy chế độ DEMO (`PUBLIC_LEAD_ENDPOINT` trống) |
| Media URL | `/media/v2/...` cố định trong `media.public.json` |
| V1 (tham khảo, chỉ đọc) | Pages Function `functions/media/[[path]].ts` proxy R2 hỗ trợ Range 200/206/416; `r2.dev` public URL ở chế độ primary |

## 1. Chốt kiến trúc (đề xuất)

```
Trình duyệt ──► Cloudflare Pages  draftylab-v2          (HTML/JS/CSS, ảnh WebP, preview ≤2MB)
                 ├─ /media/v2/video/*   ─► Pages Function ─► R2 bucket  draft2   (mp4 720p, Range)
                 └─ /api/lead  (POST)   ─► Pages Function ─► Turnstile verify ─► lưu D1 + gửi thông báo
```

- **Video qua Pages Function + R2 binding (cùng origin)**, không dùng `r2.dev` (Cloudflare không khuyến nghị cho production, có giới hạn tốc độ). Port từ V1 sang V2 (copy, không sửa V1). Phương án dự phòng: bucket gắn custom domain `media.<tên-miền>`.
- **Tên file media có hash** (`…-720.<hash>.mp4`) để cache `immutable` 1 năm mà không sợ phiên bản cũ; `media.public.json` do pipeline sinh ra đã trỏ đúng.
- **Lead**: Pages Function `functions/api/lead.ts` (cùng project, không cần server riêng).

## 2. Form gửi thật (`/api/lead`)

Thiết kế
- Kiểm tra lại **phía server** đúng luật như client: 4 bước, tên 2–80 ký tự, liên hệ theo phương thức (SĐT VN / email / Instagram), danh sách lựa chọn nằm trong whitelist, ghi chú ≤ 500, tổng payload ≤ 4 KB.
- Chống spam: honeypot (đã có) + **Cloudflare Turnstile** (token verify phía server) + giới hạn tần suất theo IP (Rate Limiting binding hoặc KV, ví dụ 5 yêu cầu / 10 phút) + kiểm tra `Origin`.
- Lưu: **D1** (bảng `leads`, có `created_at`, `status`), kèm gửi **thông báo** tới kênh bạn chọn (mục 6).
- Bảo mật/PII: không log nội dung; secret chỉ ở Cloudflare (Variables & Secrets), không có trong repo; thêm checkbox đồng ý + 1 dòng chính sách quyền riêng tư (chủ đề dữ liệu cá nhân); đặt thời hạn lưu (ví dụ 12 tháng, xoá thủ công/cron).
- UI: chỉ báo **“Đã nhận yêu cầu liên hệ”** khi server trả 2xx (không hứa đặt lịch gọi); lỗi → nút thử lại; bỏ banner DEMO **chỉ khi** `PUBLIC_LEAD_ENDPOINT` được cấu hình; chống gửi đôi (đã có).
- Test: unit cho validator dùng chung (client/server), Playwright với `wrangler pages dev` (Turnstile test keys), kiểm tra 400/429/403, không lộ PII trong response.

## 3. Video lên R2

1. Tạo bucket **mới** `draft2` (không dùng bucket V1).
2. Script `scripts/upload-media.mjs` (dry-run mặc định): liệt kê file, kích thước, hash; upload qua `wrangler r2 object put` hoặc S3 API; **không ghi đè** object cùng key khác nội dung; có `--verify` (HEAD + so size/etag).
3. Function `functions/media/[[path]].ts`: GET/HEAD, Range 206/416, `Content-Type: video/mp4`, `Cache-Control: public, max-age=31536000, immutable`, `Accept-Ranges`, validate path (không `..`), CORS không cần (cùng origin).
4. `resolveMediaSrc` đã có chế độ `local`; thêm chế độ `r2` (biến `PUBLIC_MEDIA_MODE`). Build production loại `public/media/v2/**/*.mp4` (720p) khỏi `dist` bằng bước `prebuild`/copy có lọc — poster, ảnh, preview vẫn vào `dist`.
5. Kiểm tra: mọi video 200/206 đúng Range, seek giữa video dài, Safari yêu cầu Range ổn, tổng dung lượng ≈ 0.6 GB (nằm trong gói miễn phí R2 10 GB; egress R2 miễn phí).

## 4. Deploy (bản V2 riêng, chưa lên tên miền chính)

- Project Pages mới **`draftylab-v2`**; phát hành bằng `wrangler pages deploy dist --project-name draftylab-v2` (hoặc nối Git nếu bạn muốn) → URL `*.pages.dev`, **giữ `noindex`**.
- Thêm `public/_headers`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (camera/mic/geolocation = tắt — Reflective Card không dùng camera), **CSP** (script inline của dialog-bootstrap xử lý bằng hash hoặc nonce), cache: `/_astro/*` và `/media/v2/*` immutable, HTML `no-cache`.
- SEO khi go-live: `robots.txt`, `sitemap`, canonical + ảnh OG (cần tên miền + 1 ảnh OG), bỏ `noindex`, favicon thật (đang dùng logo V1 tạm).
- **Không** đổi DNS, không gắn domain, không công khai link rộng cho tới khi bạn ra lệnh riêng.

## 5. Các cổng duyệt (mỗi cổng dừng chờ bạn)

| Bước | Tôi làm (chỉ trong máy/local) | Cần bạn | Cổng |
|---|---|---|---|
| **3A** | Viết `functions/api/lead.ts`, `functions/media`, validator dùng chung, `_headers`, script upload (dry-run), hash tên media; chạy `wrangler pages dev` local với R2/D1 giả lập; test Playwright mới | Chốt các quyết định ở mục 6 | Bạn duyệt code + kết quả test |
| **3B** | — (tôi không có thông tin đăng nhập, và sẽ **không** xin token trong chat) | Tự chạy `wrangler login` trong terminal của bạn; tạo bucket `draft2`, D1, Turnstile site, project `draftylab-v2`; đặt secrets trong Dashboard. Tôi gửi **checklist từng lệnh** | Bạn xác nhận tài nguyên đã tạo |
| **3C** | Upload media (dry-run → thật) vào bucket MỚI, deploy preview `*.pages.dev` (noindex), chạy Playwright + kiểm tra Range trên URL thật, gửi 1 lead thử | Bạn đồng ý từng lệnh deploy/upload; **test trên iPhone/Android thật** (tôi gửi checklist) | Bạn duyệt preview |
| **3D** | Gắn domain, bỏ noindex, SEO/OG, theo dõi | Bạn quyết định tên miền & thời điểm | Chỉ khi bạn ra lệnh |

Khôi phục: mỗi deployment Pages bất biến (rollback 1 cú click); object R2 theo key có hash (không ghi đè); tắt form bằng biến `LEAD_ENABLED=false` (UI quay về DEMO/liên hệ trực tiếp).

## 6. Câu hỏi cần bạn trả lời trước 3A

1. **Nhận lead ở đâu?** Email (Resend/…), Telegram bot, Zalo OA, hay Google Sheet? Địa chỉ nhận chính thức (đang tạm dùng email V1 `thanhnguyenphotowork@gmail.com`)?
2. **Tên miền** dự kiến (cho canonical/OG/CORS/Turnstile) hoặc dùng `*.pages.dev` trước?
3. Đồng ý dùng **Turnstile + D1** (miễn phí) và chính sách lưu 12 tháng?
4. Asset V1 đang dùng tạm — xác nhận được phép công khai: logo, chân dung `portrait-founder`, 7 logo đối tác, link mạng xã hội, email. Nội dung nào cần thay trước khi lên?
5. Font: chỉ dùng **Geist (OFL)**; không đưa SF Pro/FX Parkinsans lên web — đồng ý?
6. Copy chờ duyệt: headline Hero, đoạn About, tiêu đề video gallery (hiện là bản nháp).
7. Có cần **trang chính sách quyền riêng tư** riêng, hay 1 dòng + link ngoài?
8. Website & Landing Page: có asset để hiện không, hay bỏ hẳn mục này?
9. Bạn có iPhone/Android thật để test ở 3C không (bắt buộc để ghi PASS iOS)?
10. Muốn deploy qua `wrangler` thủ công (tôi soạn lệnh, bạn chạy) hay nối Git repo?

## 7. Ước tính chi phí
Pages, R2 (≈0.6 GB), D1, Turnstile, Functions đều trong gói miễn phí ở lưu lượng portfolio; chỉ phát sinh nếu dùng dịch vụ email có phí hoặc tên miền.

## 8. Rủi ro
- Video dài tải chậm trên 4G yếu → đã có `faststart` + Range; có thể thêm bản 480p nếu đo thấy chậm.
- CSP quá chặt có thể chặn Lanyard/WebGL, font, script inline → test trên preview trước khi bật enforce (bắt đầu bằng `Content-Security-Policy-Report-Only`).
- Âm thanh tự phát yêu cầu người dùng đã tương tác trước (giới hạn của trình duyệt) — đã có fallback muted.
- iOS/Android thật chưa test — **không ghi PASS** cho tới 3C.
