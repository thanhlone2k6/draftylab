# Hướng dẫn cập nhật website Drafty Lab (DFL2)

Website chạy tại https://draftylab.pages.dev. Mã nguồn: https://github.com/thanhlone2k6/draftylab (nhánh `main`).
Thư mục làm việc trên máy: `/Users/thanhng/Documents/DFL2/website`.

## Cập nhật hằng ngày (tự động deploy)
```bash
cd /Users/thanhng/Documents/DFL2/website
git status                      # xem đã sửa gì
git add -A
git commit -m "mô tả ngắn thay đổi"
git push                        # đẩy lên main → Cloudflare tự build + deploy (2–3 phút)
```
Kiểm tra tại Cloudflare → Workers & Pages → `draftylab` → Deployments.

## Thử trước khi lên bản chính (khuyến nghị cho thay đổi lớn)
```bash
git checkout -b thu-nghiem      # tạo nhánh thử
# ...sửa, commit...
git push -u origin thu-nghiem   # Cloudflare tạo bản xem thử riêng, không ảnh hưởng website chính
```
Bản thử có địa chỉ dạng `https://thu-nghiem.draftylab.pages.dev` (đã bật hostname Turnstile chỉ cho `draftylab.pages.dev`; muốn test form trên nhánh mới phải thêm hostname đó vào widget Turnstile). Hài lòng thì: `git checkout main && git merge thu-nghiem && git push`.

## Đăng tài liệu lên tab Cộng đồng
Không cần sửa code hay deploy. Mở https://draftylab.pages.dev/admin → **Gửi mã về Gmail** → nhập mã → chọn ảnh (bấm để chọn, **kéo ảnh từ Finder vào ô**, hoặc **dán ảnh ⌘V**) → kéo/zoom trong khung **cắt vuông 1:1** đúng như thẻ trên web → gõ tiêu đề, dán link, chọn **Ngày đăng** → **Đăng bài**. Trang Cộng đồng hiện 3 thẻ đầu (4 thẻ trên điện thoại); hàng thẻ phía dưới được làm mờ và nút **Xem thêm tài liệu** mở toàn bộ.
Bấm **Sửa** trên một bài đã đăng để mở hộp thoại sửa (Escape để đóng); trong đó vẫn có đủ chọn/kéo/dán ảnh và **Chỉnh lại / cắt ảnh** cho ảnh hiện tại. Kéo thả thẻ trong danh sách (hoặc nút ↑ ↓) để đổi thứ tự hiển thị — thứ tự này độc lập với ngày đăng.

## Ô "Skill AI x Claude"
Nằm ngay trên các thẻ tài liệu ở trang Cộng đồng. Trong `/admin`, mục **Skill AI x Claude**: nhập tiêu đề, mô tả, link (GitHub…) và **ảnh bìa** (bấm/kéo/dán ảnh rồi cắt 1:1; để trống thì dùng icon). Kéo thẻ để đổi thứ tự, hoặc dùng ↑ ↓. Skill đang ẩn không hiện trên web nhưng vẫn còn trong admin. Danh sách khởi tạo gồm Video Edit Skill, Herk Edit Kit và Awesome Claude Video Skills.
Sai mã 5 lần: khoá 15 phút. Sai 20 lần trong 1 giờ trên mọi máy: khoá 1 giờ và có email cảnh báo. Thiết bị được ghi nhớ 90 ngày (12 giờ nếu bỏ chọn); mỗi lần đăng nhập có email báo. Mất máy: bấm **Đăng xuất tất cả thiết bị** cuối trang admin.

## Dữ liệu nằm ở đâu
| Thứ | Ở đâu | Ghi chú |
|---|---|---|
| Mã nguồn, nội dung chữ | GitHub `main` (`src/data/content.ts`) | sửa chữ ở đây |
| Video đầy đủ 720p (26 file) | Cloudflare R2 bucket `draft2` | KHÔNG nằm trong Git; upload bằng `npm run media:upload` |
| Video hover nhỏ (6 file), ảnh | Trong Git (`public/media/v2`) | tự động theo mỗi lần deploy |
| Bài Cộng đồng | D1 `draftylab-v2-leads` bảng `community_posts`; ảnh ở R2 `draft2/community/` | quản lý tại `/admin` |
| Lead từ form | Cloudflare D1 `draftylab-v2-leads`, bảng `leads` | giữ 12 tháng; cũng gửi email về thanhnguyenphotowork@gmail.com |
| Secrets (`TURNSTILE_SECRET`, `RESEND_API_KEY`, `RATE_SALT`) | Cloudflare Pages `draftylab` (mã hoá) | không bao giờ commit vào Git |

Xem lead gần nhất:
```bash
npx wrangler d1 execute draftylab-v2-leads --remote --command "SELECT created_at,name,method,status,notify,source,consent_version FROM leads ORDER BY created_at DESC LIMIT 20"
```

## Đồng ý & thời hạn lưu lead (từ 06/11/2026)
- Form Quick Call có ô đồng ý **không tích sẵn**; server chỉ nhận `consent: true` và lưu `consent_at`, `consent_version`, `consent_text` trong bảng `leads`.
- **Trước khi deploy bản có migration `0006_lead_consent.sql` + `0007_lead_source.sql`**, phải chạy migration lên production trước (nếu không, form sẽ lỗi khi ghi lead):
```bash
npx wrangler d1 migrations apply draftylab-v2-leads --remote
```
- Chính sách nói lead được giữ tối đa **12 tháng**. Chạy định kỳ (ví dụ mỗi tháng) sau khi đã sao lưu nếu cần:
```bash
npx wrangler d1 execute draftylab-v2-leads --remote --command "DELETE FROM leads WHERE created_at < strftime('%s','now') - 31536000"
```
- Trang chính sách: `/privacy/` (VI) và `/<lang>/privacy/` (EN/FR/DE/NL); nội dung ở `src/data/privacy.ts`. Bản tiếng Việt là bản chính.
- Thẻ **Custom Skill** nằm ở cuối trang Cộng đồng; nút “Đặt yêu cầu” mở lightbox liên hệ ngắn. Lead của form này được lưu với `source = custom-skill` (migration `0007`), tách khỏi Quick Call (`source = quick-call`).

## PostHog (thống kê truy cập)
- Key nằm trong `package.json` (`build:cf` / `build:preview`), host US `https://us.i.posthog.com`; loader lấy từ `https://us-assets.i.posthog.com`.
- Đang đo: `$pageview` toàn site, event `community_view` cho `/cong-dong/` + `/<lang>/community/`, và `custom_skill_cta_click` cho nút “Đặt yêu cầu” của thẻ Custom Skill.
- Cấu hình: không ghi IP, không autocapture, không session recording, không surveys; `persistence: 'localStorage'`.
- **Không có banner đồng ý** (owner chọn phương án C ngày 06/11/2026). Chính sách đã nêu PostHog; nếu sau này muốn chắc hơn về pháp lý, thêm banner và chỉ init PostHog sau khi đồng ý trong `src/components/analytics/PostHog.astro`.



## Đổi / thêm video
1. Thêm video nguồn vào thư mục media (xem `docs/asset-inventory.md`), chạy `npm run media:build`.
2. `npm run media:upload` để đưa bản 720p lên R2 (không xoá gì).
3. Commit + push như trên.

## Quy tắc an toàn
- Không commit `.env`, `.dev.vars`, khoá API, file `.mp4` lớn (gitignore đã chặn).
- Không xoá bucket `draft2`, D1 `draftylab-v2-leads`, hay branch/tag `backup-v1`, `v1-final-2026-10-17`.
- Đổi secret: `npx wrangler pages secret put TEN_SECRET --project-name draftylab`.

## Quay lại bản V1 khi có sự cố
1. Nhanh nhất: Cloudflare → `draftylab` → Deployments → bản `d9cbf25a…` (commit `6b0e34f`) → Rollback to this deployment.
2. Khôi phục mã nguồn: xem `docs/v1-rollback.md`.

## Thẻ "Tham gia cộng đồng ngay" ở trang chủ
Nằm ngay dưới khối Quick Call. Cả thẻ là một link mở `/cong-dong/` (hoặc `/<lang>/community/`).
Ảnh nằm bên phải trên máy tính; trên điện thoại ảnh phủ toàn thẻ ở 60% opacity để chữ vẫn đọc được. Thay ảnh: thay file `website/public/media/community/join-community.jpg` rồi build/deploy lại.
