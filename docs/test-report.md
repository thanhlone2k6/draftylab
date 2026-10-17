# Test report — Phase 1 prototype (17/10/2026)

Môi trường: macOS, Node 24.18, Astro 5.18.2 build production + `astro preview`, Playwright 1.64.1 (Chromium + WebKit).

## Kết quả lệnh

| Lệnh | Kết quả |
|---|---|
| `npm run test:media` (node:test, 13 test pipeline) | ✅ 13/13 pass |
| `npx astro check` | ✅ 0 errors, 0 warnings (51 files) |
| `npm run build` (+ `check:paths`) | ✅ build OK; 17 file trong dist + public manifest không chứa `/Users/…`, đường dẫn nguồn hay tên file gốc có dấu |
| `npx playwright test` (4 project) | ✅ **109 pass**, 15 skipped (test chỉ dành cho desktop hoặc mobile), 0 fail — gồm 9 test Phase 2 + 1 test touch cho âm lượng (volume gauge) |

Projects: `desktop-chromium` 1440×900 · `mobile-chromium` Pixel 7 390×844 · `desktop-webkit` 1440×900 (test gắn `@webkit`) · `mobile-webkit` iPhone 14 390×844 (`@webkit`, **giả lập**).

## Đã kiểm tra chức năng (tự động)

| Hạng mục | Kết quả |
|---|---|
| Load + cuộn toàn trang + hover mọi poster → **0 request `.mp4`**, không có `<video>` trong nội dung | ✅ Chromium + WebKit, desktop + mobile |
| Console: không có lỗi / pageerror / response ≥400 | ✅ |
| Không tràn ngang toàn trang (`scrollWidth ≤ clientWidth`) | ✅ (đã sửa lỗi sr-only làm tràn) |
| Nav: Work/Services/Results/About trỏ tới section có nội dung (Results/About là khối giải thích "đang hoàn thiện") | ✅ |
| **Click đầu tiên trước hydrate** (chặn toàn bộ JS bundle): Let's Talk mở dialog < 1.5s, sau khi JS về thì React hiện Stepper **trong cùng dialog** (chỉ 1 `role=dialog`, loading biến mất) | ✅ |
| Click poster trước hydrate → dialog mở, tải đúng `gallery-v01-720.mp4`, sau hydrate có controls | ✅ |
| **React không tải được** (abort toàn bộ JS): dialog vẫn mở, sau 8s hiện thông báo lỗi + email, Esc/× đóng được, focus về nút, scroll mở khoá | ✅ |
| Lightbox: play/pause, seek 50%, time `/ 0:30`, mute, next/prev (2/4 → 1/4, prev bị vô hiệu ở đầu), Esc → `src` bị gỡ + paused, focus về card | ✅ |
| Focus trap 25 lần Tab trong dialog Quick Call | ✅ (đã sửa lỗi nút Back ẩn bằng visibility làm thoát focus) |
| Social @1440: 7 brand đúng thứ tự, **một hàng**, DinhHouse/Lee Chloe/Kazaki nằm trọn, Goodci bị cắt, progress "1–3 / 7", mũi tên tới Porche, 7 Depth Carousel riêng | ✅ |
| Social @390: card đầu trọn, card 2 lộ một phần (peek) | ✅ |
| Kéo chuột trên ảnh Lee Chloe → chỉ đổi slide, rail không chạy, không mở lightbox | ✅ |
| Kéo chuột trên header Kazaki → rail chạy, carousel Lee Chloe giữ nguyên | ✅ |
| Wheel dọc trên carousel → trang cuộn; wheel ngang → đổi slide, rail không chạy | ✅ |
| Bấm card bên cạnh → đưa lên trước; bấm card trước → Image lightbox, ←/→ đổi ảnh | ✅ (đã sửa lỗi gốc của Depth Carousel: stage chặn click card phía sau) |
| Video ngang Kazaki: khung lightbox đúng tỉ lệ 16:9, `object-fit: contain`, nằm trọn viewport | ✅ desktop + mobile |
| Video chưa encode (Marie): badge "Chưa sẵn sàng", **không icon play**, tag không có ▶; mở ra là poster + thông báo, không controls, 0 mp4 | ✅ |
| Touch (CDP, Chromium mobile): vuốt ngang trên ảnh → chỉ đổi slide; vuốt dọc bắt đầu trên ảnh → trang cuộn; vuốt ngang trên header → rail chạy | ✅ |
| Stepper: Next bị khoá khi chưa chọn; bước 2 chọn nhiều; Back giữ state; bước 4 báo lỗi tên/email; submit → thông báo DEMO "CHƯA được gửi đi", không có trạng thái thành công | ✅ (đã sửa lỗi a11y: dòng lỗi nằm trong `<label>`) |
| Menu mobile: mở, Esc đóng + trả focus, bấm link đóng menu, không khoá scroll | ✅ |
| Reduced motion: poster hiện ngay (opacity 1), không có Lanyard canvas, thẻ tĩnh hiện, lightbox + nút carousel vẫn hoạt động | ✅ |
| Hero: CTA vẫn bấm được khi đang rê chuột trên Dot Grid, cột Lanyard không đè cột chữ, Explore My Work cuộn tới `#work` | ✅ |

## Phase 2 — đã kiểm tra (tự động)

| Hạng mục | Kết quả |
|---|---|
| Thứ tự section `top → trusted → work → social → behind → results → process → about → contact`; **không có `#website`** (chưa có asset thật) | ✅ |
| Trusted By: 7 logo/tile tải được, link `_blank` + `rel=noopener`, hiện đủ (opacity 1) sau khi cuộn | ✅ |
| Raw → Final: 2 video mở cùng lightbox nhóm "1 / 2" → "2 / 2"; raw hiển thị **3:4 dọc** (đã xoay −90°), final 9:16; chỉ request đúng 2 mp4 sau khi click | ✅ |
| Compare Slider: Home/End/←/→ cập nhật `aria-valuenow`; kéo chuột đổi vị trí; clip-path theo tay nắm; **vuốt ngang trên mobile đổi giá trị, vuốt dọc vẫn cuộn trang** | ✅ |
| Case Studies: 3 card, ảnh đã crop (Kazaki là dải ngang >3:1), nhãn trung thực ("không phải kết quả đo lường"), **không có số điện thoại**, không có từ khoá tăng trưởng/doanh thu | ✅ |
| How I Work: 4 Folder, bấm mở, bấm giấy đầu → **video lightbox đúng file**, next → ảnh đúng `how-i-work-i06`; 0 mp4 trước khi bấm | ✅ |
| About: **không gọi `getUserMedia`** (hook vào API), tên/vai trò đúng, không có số năm kinh nghiệm | ✅ |
| Toàn trang dài: 0 mp4 khi cuộn, 0 console error, không tràn ngang | ✅ |
| Nav pill: tô sáng đúng mục đang xem, mất highlight ở section không có link | ✅ |
| Trạng thái "Chưa sẵn sàng" (giữ cho asset tương lai) kiểm bằng nút giả → có thông báo, không có controls, 0 mp4 | ✅ |

## Lỗi tìm ra và đã sửa trong lúc test

1. `sr-only` (absolute) trong card brand thoát khỏi vùng cuộn của rail → `documentElement.scrollWidth` 3041px. Đã sửa: rail/card `position: relative`.
2. Lần thử phát lại không tiếng (logic V1) có thể chạy **sau khi đã đóng** dialog → `play()` trên phần tử không có nguồn. Đã sửa: chỉ thử lại khi còn mở và vẫn là video đó.
3. Focus trap tính cả nút Back của Stepper đang `visibility: hidden` → focus thoát ra `body`. Đã sửa.
4. Depth Carousel (bản gốc): lớp stage (z=0) chặn click vào card nằm sau (translateZ âm). Đã sửa bằng CSS `pointer-events: none` trên stage.
5. Card bên cạnh chỉ lộ 12px → tăng `spread` 36 → 58.
6. Form: thông báo lỗi nằm trong `<label>` làm sai tên của ô nhập → tách label/`htmlFor` + `aria-describedby`.

7. (Sau review) Lanyard bị cắt: canvas chỉ cao 640px và đặt giữa cột → thẻ văng ra ngoài/bị cắt, dây lộ đầu cắt. Đã sửa: canvas phủ **toàn chiều cao hero** (sát header, dây thòng xuống từ mép header), thẻ nhỏ hơn (size 0.54, strap 0.3), và giới hạn kéo thẻ trong khung (`// DFL2:` trong Lanyard.tsx). Đã thử kéo thẻ tới 3 góc ở 1440×855 và 1280×650: thẻ luôn nằm trọn.
8. Focus trap: tự xoay focus bằng code thay vì dựa vào Tab gốc (WebKit bỏ qua nút khi Tab).

9. (Phase 2) Folder của React Bits render server với màu mặc định xanh (lệch hydration) → đổi sang `client:only`.
10. (Phase 2) Case-study ảnh tràn khung do `max-height:100%` trong grid → dùng `object-fit: contain` với khung cố định.
11. (Phase 2) Nav giữ highlight "Results" khi đang ở How I Work → highlight chỉ khi section có link.
12. (Phase 2) Test: tên file macOS là NFD, so sánh `expectFile` phải chuẩn hoá NFC.
13. Máy đang tải nặng (load ~50) nên timeout test nâng lên 120s; test thời gian mở dialog dùng ngưỡng 4s.

## Screenshots (`docs/screenshots/`)

1440×900 và 390×844 (DPR 2): `01-hero`, `02-video-gallery`, `03-social-start`, `04-social-scrolled`, `05-social-not-ready`, `06-lightbox-portrait`, `07-lightbox-landscape`, `08-quickcall-step1`, `09-quickcall-step4-validation`, `10-quickcall-demo-result`, Phase 2: `11-trusted-by`, `12-behind-raw-final`, `13-behind-ai-compare`, `14-case-studies`, `15-how-i-work-closed`, `16-how-i-work-open`, `17-about-founder`, `18-footer`. Tạo lại bằng `node tests/shoot.mjs` (cần `astro preview --port 4322`).

## Chưa kiểm thử / giới hạn

- **iOS Safari: NOT TESTED ON REAL DEVICE.** Chỉ chạy WebKit giả lập iPhone 14 (Playwright). Không được tính là PASS cho iPhone thật.
- **Android thật: NOT TESTED ON REAL DEVICE.**
- Vuốt touch chỉ được tự động hoá trên Chromium (CDP); WebKit giả lập không có API vuốt tương đương.
- Âm thanh khi phát: môi trường headless có thể buộc phát không tiếng; nhánh "phát không tiếng + nút bật tiếng" có code nhưng chưa được xác nhận trên Safari thật.
- Hiệu năng (FPS Dot Grid / Lanyard, long tasks) chưa đo bằng profiler; Dot Grid dừng khi ngoài viewport/tab ẩn, Lanyard chỉ tải trên desktop.
- Chưa test trên Firefox.


## Update 17/10/2026 (second review round)

New/changed behaviour covered by tests: no divider lines and section padding ≤ 64px; Video Editing has no play button and previews on hover (muted, looping, only `*-preview.mp4` requested, detached on leave, stopped when the lightbox opens); Raw → Final has no lightbox, previews on hover / tap, one preview at a time, raw shown 3:4 and final 9:16; Social rail frameless, larger, drifts left, pauses on hover, resumes on leave, loops endlessly (2+ laps of arrow clicks), drag/wheel/touch ownership; Compare slider follows the mouse with no button pressed; How I Work copy removed; no `-720.mp4` is ever requested by a hover.

Performance note found while testing: with a modal open the hero WebGL (Dot Grid + Lanyard) kept rendering behind it (frame rate 5 → 61 fps in headless software GL once paused; clicks 2.8 s → 43 ms). The hero is now `content-visibility: hidden` while a dialog is open.

## Update 17/10/2026 (third round)

Covered: Social items never open a dialog (no `[data-dfl-open]` in `#social`, front-slide tap does not zoom); video slides play in place — auto, loop, volume 0.5 unmuted when hovered after a user gesture, muted on leave (keeps playing), tap pauses/resumes, landscape `object-fit: contain`, source detached when the slide changes; no hint pill / counts / action buttons / section sentence in Social; gallery hover preview now at volume 0.5; Behind the Creative items ≤ 400 px tall, equal heights, centred, ≥ 24 px clear of the container edges.
Environment note: the test machine is heavily loaded (load average 30–60); drift/timing assertions use generous windows. Autoplay-with-sound depends on the browser's user-activation rule, so tests click once before asserting sound.

## Update 17/10/2026 (fourth round — touch volume)

Covered by `phase1.spec.ts` › “Volume (touch)” (Chromium + WebKit, touch projects only) and by the updated Raw → Final test:

- **Touch never opens the lightbox by tapping a card.** First tap plays the preview **in place with sound** at the session level (50% by default, unmuted because a tap is a real gesture); a small ⤢ button in the card corner opens the lightbox (hidden on hover devices, where clicking the card still opens it). Opening the lightbox stops the in-place preview.
- **Second tap opens the in-place volume gauge** (React Bits `SloshGauge`): a liquid tank centred over the card, the video behind it blurred (`backdrop-filter`, `filter: blur()` fallback), plus the gauge's pause/play control. Asserted: gauge visible, card marked `data-volume-open`, video still playing, `aria-valuenow` follows the drag, the video's `volume` equals the store while dragging.
- **The level is shared (session)**: it applies to the running video, to the next card, and to the lightbox video (single `window.__dflVolume` store; `?raw`-inlined script, no storage → reload returns to 50%). Dragging to ~15% and then opening the next card/video shows the same level.
- Tapping outside the tank closes the gauge (the click that closed it cannot immediately reopen it), Escape closes it, and the preview keeps playing (pause is the gauge's own control).
- Raw/Final hover previews stay **muted on hover** (their preview clips are picture-only), and get sound on touch taps like the gallery cards; Social front slides use the same session level.

Environment note: the desktop mute/loud assertions depend on the browser's autoplay policy; WebKit mobile emulation passed both touch flows.
