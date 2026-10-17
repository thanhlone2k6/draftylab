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

## Dữ liệu nằm ở đâu
| Thứ | Ở đâu | Ghi chú |
|---|---|---|
| Mã nguồn, nội dung chữ | GitHub `main` (`src/data/content.ts`) | sửa chữ ở đây |
| Video đầy đủ 720p (26 file) | Cloudflare R2 bucket `draft2` | KHÔNG nằm trong Git; upload bằng `npm run media:upload` |
| Video hover nhỏ (6 file), ảnh | Trong Git (`public/media/v2`) | tự động theo mỗi lần deploy |
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
