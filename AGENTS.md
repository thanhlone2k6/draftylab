<!-- visual-editing-draftylab BEGIN -->
# Drafty Lab — Developer & Visual Editing Guidelines

## Kiến trúc Multi-Agent & Vai trò
- **Primary Orchestrator**: Tiếp nhận yêu cầu (theo tên section, ảnh screenshot hoặc Agentation pin), phân tích `PROJECT_MAP.md`, phân chia task cho subagent, chạy kiểm thử QA và là agent DUY NHẤT thực hiện merge code vào nhánh chính sau khi build đạt chuẩn.
- **Subagent UI/UX**: Chuyên định vị và tinh chỉnh các thành phần visual, typography, màu sắc, bố cục và hình ảnh.
- **Subagent Frontend**: Đảm nhiệm animation (GSAP/CSS), tương tác, slider, video hover preview và responsive.
- **Subagent QA**: Kiểm tra console error, accessibility, form inputs, test Playwright desktop/mobile và chạy `npm run build`.
- **Subagent Explore**: Khảo sát mã nguồn, đọc dữ liệu `src/data/`, lập chỉ mục component và selector (chế độ read-only).

## Quy trình Visual Editing
1. **Chọn element & Ghi chú**: Trên giao diện chạy dev mode (`npm run dev`), dùng Agentation toolbar để gắn pin/chọn phần tử cần chỉnh sửa, kèm yêu cầu mô tả chi tiết (hoặc chụp ảnh màn hình / nêu tên Section theo PROJECT_MAP.md).
2. **OpenCode định vị file**: Đọc thông tin selector/path/text context từ annotation hoặc `data-gl-source` của Glide, tra cứu đúng file component trong `src/components/`, `src/pages/`, `src/data/content.ts` hoặc CSS tương ứng.
3. **Sửa an toàn trên Worktree / Branch riêng**: Khi sửa code, tạo worktree/branch độc lập, tránh xung đột file.
4. **Kiểm tra tự động trước khi merge**: Playwright desktop & mobile + `npm run build` thành công.
5. **Merge & Resolve**: Primary Orchestrator thực hiện review `git diff` và merge vào nhánh chính.

## Quy tắc Sửa Scoped (MẶC ĐỊNH — ưu tiên tốc độ)
Khi yêu cầu đã xác định được section/file đích (theo tên section, annotation, hay index Mục 6 của `PROJECT_MAP.md`):
- **Chốt scope trước khi sửa**: liệt kê 1–2 file sẽ đụng, báo ngắn cho user, rồi chỉ đọc/sửa đúng các file đó. Cấm khảo sát toàn repo, không spawn explore subagent khi bản đồ đã trả lời sẵn.
- **Text/data chỉ sửa `src/data/`**: đổi câu chữ, dự án, logo, media URL → sửa file data tương ứng, KHÔNG đụng component `.astro`.
- **QA bậc thang theo mức độ thay đổi** (mặc định bỏ bước thừa):
  - Đổi text/data → không Playwright, không build (xem trực tiếp qua HMR).
  - Đổi CSS/layout 1 component → Playwright 1 viewport liên quan, không build.
  - Đổi JS/logic/media URL/form submit, hoặc trước khi merge → `npm run build` 1 lần + Playwright 2 viewport.
- **Worktree chỉ cho thay đổi lớn** (refactor, nhiều section, > ~30 dòng). Sửa scoped nhỏ: sửa trực tiếp + commit gọn, vẫn show `git diff` cho user duyệt.
- **Ngoài scope phải xin phép**: phát hiện cần sửa file ngoài scope → dừng và đề xuất mở scope, không tự ý sửa lan man.
- Full suite (build + Playwright 2 viewport) chỉ bắt buộc ở bước cuối trước merge, không chạy sau mỗi lần chỉnh nhỏ.

## Quy tắc Media & Deploy (R2 cho video — BẮT BUỘC)
- **Mọi file `.mp4` đều host trên Cloudflare R2, TUYỆT ĐỐI KHÔNG commit `.mp4` vào git.** Cloudflare Pages (Free) giới hạn 25MB/file — commit video lớn (vd. `kz2.mp4` 80MB) làm build production **failed** ngay lập tức (sự cố ngày 12/10/2026).
- Base URL video tập trung tại `src/data/media.ts` (`R2_MEDIA_BASE` + helper `r2(path)`). Component/data chỉ gọi `r2('work/xxx.mp4')`, không hard-code domain.
  - Bucket hiện tại: `draftylab-media` (APAC), public base `https://pub-e389a414549e4830882a9b251f7b95ec.r2.dev` (r2.dev public URL — rate-limited, khi lên production thật nên gắn custom domain vào bucket rồi đổi 1 dòng `R2_MEDIA_BASE`).
- Poster/ảnh (`.jpg`/`.webp`, tất cả < 25MB) vẫn để trong `public/media/` và commit bình thường.
- Thêm video mới: upload lên R2 (giữ cấu trúc thư mục `hero/`, `work/`, `process/`), rồi trỏ code qua `r2()`. `.gitignore` đã chặn `public/media/**/*.mp4` để không vô tình commit.
<!-- visual-editing-draftylab END -->
