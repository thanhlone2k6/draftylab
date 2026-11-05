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
npx wrangler d1 execute draftylab-v2-leads --remote --command "SELECT created_at,name,method,status,notify FROM leads ORDER BY created_at DESC LIMIT 20"
```

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
