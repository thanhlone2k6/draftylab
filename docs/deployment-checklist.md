> **Cập nhật 17/10/2026:** các bước 1, 2, 4, 5 và 6 đã được thực hiện cho bản thử nghiệm — xem `phase3-3b-report.md` (bucket thực tế là **`draft2`**, không phải `draftylab-v2-media`). Còn lại cho bạn: Turnstile (bước 3), nhận lead, test thiết bị thật, tắt Public Development URL.

# Checklist 3B/3C — bạn chạy trong terminal của bạn (tôi KHÔNG có và KHÔNG xin thông tin đăng nhập)

Mọi bước dưới đây tạo tài nguyên **mới** cho V2. Không dùng `draftylab` / `draftylab-media` của V1. Mỗi bước có lệnh kiểm tra; dừng ở bước nào có lỗi rồi báo tôi.

## 0. Chuẩn bị
```bash
cd /Users/thanhng/Documents/DFL2/website
npx wrangler login            # trình duyệt mở ra để bạn đăng nhập Cloudflare
npx wrangler whoami           # xác nhận đúng tài khoản
```

## 1. R2 — bucket mới
```bash
npx wrangler r2 bucket create draft2
npx wrangler r2 bucket list                    # phải thấy draft2 (và KHÔNG chạm draftylab-media)
```

## 2. D1 — database mới + migration
```bash
npx wrangler d1 create draftylab-v2-leads      # in ra database_id → dán vào wrangler.toml (thay 0000…)
npx wrangler d1 migrations apply DB --remote   # tạo bảng leads, rate_limit
npx wrangler d1 execute DB --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

## 3. Turnstile (Dashboard → Turnstile → Add site)
- Hostname: `draftylab-v2.pages.dev` (thêm tên miền thật sau). Widget mode: Managed.
- Giữ **Site key** (công khai) và **Secret key** (bí mật).

## 4. Project Pages mới
```bash
npx wrangler pages project create draftylab-v2 --production-branch main
```
Dashboard → Workers & Pages → `draftylab-v2` → Settings:
- **Bindings**: D1 `DB` → `draftylab-v2-leads`; R2 `MEDIA_BUCKET` → `draft2` (cho cả Production và Preview).
- **Variables and Secrets** (Production + Preview):
  - Secrets: `TURNSTILE_SECRET`, `RATE_SALT` (chuỗi ngẫu nhiên dài), và nếu dùng email: `RESEND_API_KEY`; nếu dùng Telegram: `TELEGRAM_BOT_TOKEN`.
  - Variables: `LEAD_NOTIFY` (`resend` | `telegram` | `none`), `LEAD_TO_EMAIL`, `LEAD_FROM_EMAIL` / `TELEGRAM_CHAT_ID`, `LEAD_ENABLED=true`, `ALLOWED_ORIGINS` (nếu có thêm tên miền).

## 5. Upload video (3C — chỉ sau khi bạn duyệt 3A và hoàn tất 1–4)
```bash
PUBLIC_LEAD_ENDPOINT=/api/lead PUBLIC_TURNSTILE_SITEKEY=<site key> npm run build:deploy
node scripts/upload-media.mjs                                   # DRY RUN: kiểm tra 26 object, ~583 MB
node scripts/upload-media.mjs --execute --remote --bucket draft2 --confirm-bucket draft2
npx wrangler r2 object get draft2/gallery/gallery-v01-720.<hash>.mp4 --remote --file /tmp/x.mp4   # thử 1 object
```

## 6. Deploy preview (noindex, URL `*.pages.dev`)
```bash
npx wrangler pages deploy dist --project-name draftylab-v2 --branch preview
```
Kiểm tra (thay `$URL` bằng URL in ra):
```bash
curl -sI $URL/ | grep -iE "content-security-policy-report-only|x-frame|permissions-policy"
KEY=$(curl -s $URL/ | grep -o '/media/v2/gallery/gallery-v01-720\.[0-9a-f]*\.mp4' | head -1)
curl -sI $URL$KEY                                  # 200, video/mp4, Accept-Ranges, immutable
curl -s -o /dev/null -w "%{http_code}\n" -H "Range: bytes=0-1023" $URL$KEY   # 206
```
Rồi: gửi 1 lead thử qua form (Turnstile thật) → kiểm tra D1:
```bash
npx wrangler d1 execute DB --remote --command "SELECT id, created_at, name, method, notify FROM leads ORDER BY created_at DESC LIMIT 5"
```
**Test thủ công trên iPhone và Android thật** (video lightbox có tiếng, hover/tap preview, rail Social vuốt, Quick Call với bàn phím ảo, Lanyard fallback). Không ghi PASS iOS nếu chưa làm.

## 7. Vận hành
- Xoá lead quá 12 tháng (chạy định kỳ hoặc thủ công):
  `npx wrangler d1 execute DB --remote --command "DELETE FROM leads WHERE created_at < strftime('%s','now','-12 months')"`
- Tắt form khẩn cấp: đặt `LEAD_ENABLED=false` (form báo "tạm ngưng", hiện email liên hệ).
- Rollback: Dashboard → Deployments → deployment trước → Rollback. Object R2 có hash trong tên nên không bị ghi đè.
- Chuyển CSP từ Report-Only sang enforce: đổi tên header trong `deploy/headers.template` thành `Content-Security-Policy` **sau** khi xem preview thật không còn báo cáo vi phạm.

## 8. Chưa làm (3D — chỉ khi bạn ra lệnh riêng)
Gắn tên miền/DNS, bỏ `noindex`, canonical + ảnh OG + sitemap, thay asset V1 tạm bằng asset chính thức.
