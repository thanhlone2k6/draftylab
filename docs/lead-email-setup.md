# Nhận lead qua email (Resend) + Turnstile — hướng dẫn từng bước

Trạng thái 17/10/2026: **code + cấu hình đã deploy** lên https://preview.draftylab-v2.pages.dev. Còn 2 thứ **chỉ bạn làm được** (tài khoản + khoá bí mật): `RESEND_API_KEY` và `TURNSTILE_SECRET`. Khoá bí mật chỉ nhập trong terminal của bạn, **không gửi vào chat**.

## Email lead hiện có
- Gửi từ backend (Pages Function), API key nằm trong Cloudflare, không lộ ra frontend.
- **Tiêu đề:** `[DFL2] New Lead – <Tên khách>`
- **Nội dung (văn bản thuần):** tên, cách liên hệ + giá trị, lĩnh vực, dịch vụ quan tâm (tất cả mục đã chọn), hiện trạng content, **ngân sách dự kiến** (hoặc "(không chọn)"), ghi chú (hoặc "(không có)"), thời gian (GMT+7), mã lead, nguồn (host), ghi chú đã lưu D1.
- Nếu khách để **email**, nút Reply trả lời thẳng cho khách (`reply_to`).
- Lead **luôn được lưu D1 trước**; gửi email lỗi không làm mất lead (cột `notify` = `sent`/`failed`/`skipped`, `notify_ref` = mã email Resend hoặc `err:<mã lỗi>`).
- Ngân sách là câu hỏi **tuỳ chọn** thêm vào bước 3 (vẫn 4 bước). Các mức (`Dưới 5 triệu`, `5 – 15 triệu`, `15 – 30 triệu`, `Trên 30 triệu`, `Chưa xác định`) là **bản nháp** — sửa trong `src/data/lead-options.ts`.

## Bước A — Resend (miễn phí: 100 email/ngày, 3.000/tháng)
1. Mở https://resend.com/signup → đăng ký bằng **đúng email nhận lead: `thanhnguyenphotowork@gmail.com`** (bắt buộc: người gửi thử `onboarding@resend.dev` của Resend chỉ gửi được tới email của chính chủ tài khoản; không cần xác minh tên miền).
2. Xác nhận email (Gmail gửi thư kích hoạt).
3. Vào **API Keys → Create API Key**: Name `dfl2-leads` · Permission **Sending access** · Domain **All domains** → **Add** → sao chép khoá bắt đầu bằng `re_…` (chỉ hiện một lần).
4. Trong terminal của bạn:
   ```bash
   cd /Users/thanhng/Documents/DFL2/website
   npx wrangler pages secret put RESEND_API_KEY --project-name draftylab-v2
   npx wrangler pages secret put RESEND_API_KEY --project-name draftylab-v2 --env preview
   ```
   Mỗi lần dán khoá `re_…` khi được hỏi rồi Enter (không hiển thị khi gõ).
5. Nhắn tôi **"đã đặt Resend key"**. Tôi sẽ deploy lại, gửi một lead thử có tiêu đề `TEST`, kiểm tra D1 (`notify=sent`, `notify_ref` = mã email) và bạn xác nhận hộp thư (thư có thể nằm ở Spam lần đầu — bấm "Not spam").
6. Xem lịch sử gửi: Resend → **Emails** (trạng thái Delivered/Bounced).

Sau này muốn gửi từ địa chỉ riêng (ví dụ `leads@<tên-miền>`): Resend → Domains → Add Domain → thêm các bản ghi DNS → đổi `LEAD_FROM_EMAIL` trong `wrangler.toml`. Không cần làm bây giờ.

## Bước B — Turnstile secret (site key đã được gắn vào bản deploy)
- Site key đã kiểm tra: Cloudflare chấp nhận trên `preview.draftylab-v2.pages.dev` (widget tạo ra, không báo lỗi khoá).
- **Khoá bí mật (Secret key) có trong ảnh bạn gửi tôi** → hãy coi là đã lộ: Dashboard → Turnstile → widget → **Rotate secret key**, rồi đặt khoá MỚI:
  ```bash
  npx wrangler pages secret put TURNSTILE_SECRET --project-name draftylab-v2
  npx wrangler pages secret put TURNSTILE_SECRET --project-name draftylab-v2 --env preview
  ```
- Kiểm tra trong widget: **Hostnames** có `draftylab-v2.pages.dev` và `preview.draftylab-v2.pages.dev`; sau này thêm tên miền chính.
- Sau khi đặt secret, tôi deploy lại. Từ lúc đó server **bắt buộc** token hợp lệ (403 nếu thiếu/sai).

## Lưu ý
- Secret mới chỉ có hiệu lực ở **deployment mới** → sau mỗi lần đặt secret cần deploy lại (`npm run deploy:preview`).
- Kiểm tra bằng form trên điện thoại/máy tính: Turnstile có thể hiện hộp tích "Xác minh bạn là người thật" lần đầu — bình thường.
- Tắt khẩn cấp: đặt `LEAD_ENABLED = "false"` trong `wrangler.toml` rồi deploy lại (form báo tạm ngưng, hiện email liên hệ).
