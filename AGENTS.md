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

## Quy tắc Media & Deploy (R2 cho video — BẮT BUỘC)
- **Mọi file `.mp4` đều host trên Cloudflare R2, TUYỆT ĐỐI KHÔNG commit `.mp4` vào git.** Cloudflare Pages (Free) giới hạn 25MB/file — commit video lớn (vd. `kz2.mp4` 80MB) làm build production **failed** ngay lập tức (sự cố ngày 12/10/2026).
- Base URL video tập trung tại `src/data/media.ts` (`R2_MEDIA_BASE` + helper `r2(path)`). Component/data chỉ gọi `r2('work/xxx.mp4')`, không hard-code domain.
  - Bucket hiện tại: `draftylab-media` (APAC), public base `https://pub-e389a414549e4830882a9b251f7b95ec.r2.dev` (r2.dev public URL — rate-limited, khi lên production thật nên gắn custom domain vào bucket rồi đổi 1 dòng `R2_MEDIA_BASE`).
- Poster/ảnh (`.jpg`/`.webp`, tất cả < 25MB) vẫn để trong `public/media/` và commit bình thường.
- Thêm video mới: upload lên R2 (giữ cấu trúc thư mục `hero/`, `work/`, `process/`), rồi trỏ code qua `r2()`. `.gitignore` đã chặn `public/media/**/*.mp4` để không vô tình commit.
<!-- visual-editing-draftylab END -->
