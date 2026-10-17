# Phase 3 — bước 3B/3C (17/10/2026): đã triển khai bản thử nghiệm

**URL thử nghiệm (noindex, không liên kết ở đâu):** https://preview.draftylab-v2.pages.dev  
Project Pages **mới** `draftylab-v2`. Không đụng V1 (`draftylab`, bucket `draftylab-media`) và site khác trong tài khoản (`dinhhouse-website`). Không đổi DNS, không gắn tên miền.

## Đã tạo / cấu hình (chỉ tài nguyên V2)

| Hạng mục | Chi tiết |
|---|---|
| R2 | bucket **`draft2`** (bạn tạo) — đã **upload 26 video 720p = 583 MB**, tên có hash, content-type `video/mp4`. Binding `MEDIA_BUCKET` → `draft2` (khai báo trong `wrangler.toml`) |
| D1 | **`draftylab-v2-leads`**, region APAC, id `820ba591-e81e-481c-a0d4-1ff785dc7610` (id không phải bí mật); đã chạy migration `0001_leads.sql` (bảng `leads`, `rate_limit`). Binding `DB` |
| Pages | project `draftylab-v2`, nhánh `preview`, 211 file / 28 MB (không có video lớn), Functions `/api/lead` + `/media/v2/*`, `_headers`, `_routes.json` |
| Secrets | `RATE_SALT` (chuỗi ngẫu nhiên, đã đặt cho production + preview; không hiển thị ở đâu) |
| Vars | `LEAD_ENABLED=true`, `LEAD_NOTIFY=none` (trong `wrangler.toml`) |
| Build | `PUBLIC_LEAD_ENDPOINT=/api/lead` → form chạy thật (không còn banner DEMO) |

Lưu ý: vì `wrangler.toml` là nguồn cấu hình của Pages, mục Bindings/Variables trong Dashboard sẽ **chỉ đọc**; sửa biến thường trong `wrangler.toml` rồi deploy lại; secret dùng `wrangler pages secret put`.

## Kiến trúc R2: CORS / custom domain — đã kiểm tra, **không cần**
- Video đi **cùng origin**: trình duyệt gọi `/media/v2/...` → Pages Function đọc R2 bằng binding (Range 206/416, ETag, cache immutable). Không có request cross-origin ⇒ **không cần CORS**.
- Không dùng `https://pub-….r2.dev` (Public Development URL bạn bật) — Cloudflare chỉ khuyến nghị cho dev, có giới hạn. Nên **tắt** sau khi bạn xác nhận xong: `npx wrangler r2 bucket dev-url disable draft2` (hoặc R2 → `draft2` → Settings → Public Development URL → Disable). Hiện bucket không có custom domain nào.
- Custom domain cho R2 chỉ cần nếu sau này muốn phát video thẳng từ `media.<tên-miền>` (bỏ qua Function). Với lưu lượng portfolio, kiến trúc hiện tại là đủ.

## Kiểm tra trên bản đã deploy

| Kiểm tra | Kết quả |
|---|---|
| Trang chủ 200; `x-robots-tag: noindex`; `x-frame-options: DENY`; CSP Report-Only với đúng hash inline script | ✅ |
| **184 URL media trong manifest** (poster, ảnh full, preview, video 720p) đều trả 200/206 | ✅ 184/184 |
| Video từ R2: HEAD 200 `video/mp4`, `Accept-Ranges`, `immutable`; `Range` → **206** + `Content-Range`; range vượt → **416** | ✅ |
| Clip preview (static, nằm trong deployment) vẫn tải được qua route `/media/v2` | ✅ (đã sửa lỗi 404: Function giờ chuyển cho static khi object không có trong R2) |
| File không tồn tại → **404 thật** (thêm `404.html`; trước đó Pages trả trang chủ mã 200 cho cả `.mp4` thiếu) | ✅ |
| Trình duyệt thật (Chromium): 103 ảnh giải mã đủ, 0 lỗi trang, **0 vi phạm CSP**, lightbox phát video từ R2, hover preview phát ở **50% âm lượng** | ✅ |
| Form qua UI: gửi lead thử → "Đã nhận yêu cầu liên hệ"; có banner DEMO? **không** | ✅ |
| API: Origin lạ → 403; payload sai → 400 (không echo dữ liệu); gửi lại cùng `requestId` → `duplicate`; bản ghi đọc lại từ D1 **remote** đúng cột | ✅ |
| Dọn dẹp | 2 lead thử + bảng rate-limit đã **xoá** khỏi D1 remote (0 dòng) |
| Local: `lead-live` (workerd + D1/R2 local) | ✅ 8/8 |

## Còn lại (cần bạn)

1. **Turnstile** (chưa bật — hiện chỉ có honeypot + rate-limit; đủ cho URL thử nghiệm không công khai, **chưa đủ** khi đưa lên tên miền chính): Dashboard → Turnstile → *Add widget* → tên `draftylab-v2`, hostname `draftylab-v2.pages.dev` (+ `preview.draftylab-v2.pages.dev`), Mode *Managed*. Lấy **Site key** (gửi tôi — công khai) và **Secret key** (**không gửi**, tự đặt):  
   `npx wrangler pages secret put TURNSTILE_SECRET --project-name draftylab-v2` và thêm `--env preview`.  
   Rồi tôi build với `PUBLIC_TURNSTILE_SITEKEY=<site key>` và deploy lại.
2. **Nhận lead**: câu 1 chưa trả lời. Hiện lead chỉ nằm trong D1 (xem bằng `npx wrangler d1 execute DB --remote --command "SELECT * FROM leads ORDER BY created_at DESC LIMIT 20"`). Chọn email (Resend: tạo API key + domain gửi) hoặc Telegram (bot token + chat id) rồi đặt secret tương ứng và `LEAD_NOTIFY`.
3. **Test thật trên iPhone/Android** với URL trên (video lightbox có tiếng, preview, vuốt rail Social, Quick Call + bàn phím ảo, Lanyard) — chưa kiểm: **NOT TESTED ON REAL DEVICE**.
4. Tắt **Public Development URL** của `draft2` (xem trên).
5. Trước 3D (tên miền chính): trả lời câu 2 (tên miền) và câu 4 (asset V1 tạm: logo, chân dung, logo đối tác, link MXH, email), thay copy nháp.

## Cập nhật: email lead + Turnstile (17/10/2026)
Xem `lead-email-setup.md`. Đã deploy: email Resend (tiêu đề `[DFL2] New Lead – <tên>`, đầy đủ câu trả lời, `reply_to` cho khách), câu hỏi ngân sách tuỳ chọn, migration D1 `0002` (cột `budget`, `notify_ref`) trên cả local và remote, Turnstile site key. Chờ bạn đặt `RESEND_API_KEY` và `TURNSTILE_SECRET`.

## Email lead — đã xác nhận thực tế (17/10/2026)
Lead thử qua API trên preview → Resend `sent` → **chủ site xác nhận đã nhận email, nội dung đầy đủ** (tiêu đề `[DFL2] New Lead – <tên>`). Lead thử đã xoá khỏi D1 remote (0 dòng). Còn lại: Turnstile secret (rotate + đặt), test thiết bị thật, tắt Public Development URL của `draft2`.
