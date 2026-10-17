# V1 media audit (READ-ONLY) → V2 video engine

V1: `/Users/thanhng/Documents/Dự án mặc định/draftylab` — Astro ^5.6.1, React 19, Tailwind 4, GSAP 3.13, Cloudflare Pages + R2. **Không file V1 nào bị sửa** (kiểm tra bằng `find -newer` sau phiên).

## Các file đã đọc

| File V1 | Nội dung | Dùng lại ở V2 |
|---|---|---|
| `src/components/Work.astro` L76–100 | Markup lightbox: `<video playsinline webkit-playsinline disablepictureinpicture preload="metadata">`, nút play, seek range 0–1000, time, mute, title/sub | Chuyển thành shell tĩnh `src/components/media/DialogShell.astro` (cùng thuộc tính video) |
| `Work.astro` L206–345 | CSS lightbox, khung theo `--lb-ar`, biến thể dọc/ngang | Viết lại theo token V2 (`--dlg-ar`), cùng nguyên tắc contain/không crop |
| `Work.astro` ~L700–760 `openLightbox()` | Gán poster/src, tỉ lệ từ data rồi cập nhật bằng `loadedmetadata` (`videoWidth/videoHeight`), `muted=false; volume=0.8`, `play()` → nếu bị chặn thì **thử lại không tiếng**, khoá scroll `body.overflow`, focus nút close, lưu `lastFocus` | Port vào `src/scripts/dialog-bootstrap.js` (`loadMedia`, `open`) — giữ nguyên thứ tự |
| `closeLightbox()` | `pause()` → `removeAttribute('src')` → `load()` (dừng tải mạng và âm thanh thật sự), mở khoá scroll, trả focus | Port vào `stopVideo()` / `close()` |
| Các listener | `play/pause` → trạng thái nút; `timeupdate/loadedmetadata` → seek + time `m:ss`; seek `input` → `currentTime`; mute toggle; Escape | Port vào `VideoLightbox.tsx` (controls React) + bootstrap (Escape) |
| Rail drag | Listener trên window, `suppressClick = moved > 8`, **không dùng setPointerCapture** trên rail (vì làm click bị đổi target) | Áp dụng cho kéo rail Social ngoài (`SocialBrandRail.tsx`) |
| `src/data/media.ts` | `r2(path)`: `primary` (r2.dev) / `fallback` (`/media/` proxy) qua `PUBLIC_MEDIA_MODE` | Phase 1 chỉ dùng media local `/media/v2/...`; chế độ R2 để Phase 3 |
| `functions/media/[[path]].ts` | Proxy R2 hỗ trợ GET/HEAD, Range 206/416, kiểm tra path | Tham khảo cho Phase 3 (chưa copy) |

## Khác biệt có chủ đích so với V1

| V1 | V2 |
|---|---|
| Card tự phát preview khi hover/cuộn (480p) | **Poster tĩnh**, không có `<video>` trong card, 0 request `.mp4` trước khi click (đã có test) |
| Nhiều `<video>` trên trang + cơ chế unload khi mở lightbox | Chỉ có **một** `<video>` trong shell dialog, chỉ gán `src` khi click |
| Không next/prev | Next/prev trong cùng nhóm (gallery hoặc từng brand), dừng + dọn video trước khi đổi nguồn, nút bị vô hiệu ở hai đầu |
| Không có focus trap | Focus trap (Tab/Shift+Tab), trả focus về đúng nút đã mở, `aria-modal`, `aria-live` khi phải phát không tiếng |
| Cần JS của component để mở | Script inline mở dialog **ngay từ click đầu tiên, kể cả trước hydrate**; React tiếp quản cùng DOM; nếu React lỗi vẫn đóng được và có native controls + liên hệ |
| Thử lại không tiếng vô điều kiện | Chỉ thử lại nếu dialog còn mở và vẫn là video đó (sửa lỗi phát âm thanh sau khi đã đóng) |

## Lưu ý iOS

- Nguồn video được gán và `play()` được gọi **đồng bộ trong handler click** (user gesture), giống V1, để Safari iOS cho phát có tiếng. Nút next/prev cũng gọi trong handler click.
- `playsinline` + `webkit-playsinline`, không gọi fullscreen native.
- **NOT TESTED ON REAL DEVICE.** Mới chỉ chạy WebKit giả lập iPhone 14 bằng Playwright.
