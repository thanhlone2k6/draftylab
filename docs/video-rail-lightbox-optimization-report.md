# Video Rail & Lightbox Optimization — Report

*Ngày: 14/10/2026 · Branch: `main` (chưa push — theo yêu cầu, chỉ commit khi được duyệt)*

## 1. Root cause lỗi lightbox rail dưới trên desktop

Hai lỗi chồng nhau, đều nằm ở `src/components/Work.astro`:

1. **`rail.setPointerCapture()` trên `pointerdown`.** Theo spec Pointer Events, khi một phần tử
   đang giữ pointer capture, trình duyệt **retarget sự kiện `click` về phần tử capture** (`[data-rail]`)
   thay vì phần tử thật dưới con trỏ (card). Listener `click` gắn trên card vì thế không bao giờ chạy
   với chuột thật. QA cũ bằng `element.click()` (synthetic, bỏ qua cơ chế capture) nên không phát hiện.
2. **Marquee vẫn trôi giữa `mousedown` và `mouseup`.** Track dịch chuyển liên tục 40px/s; khi nhả chuột,
   under-the-pointer position đã khác → browser coi down/up khác target và retarget `click` lên `<html>`
   (trace thực tế: `click on HTML.`).

**Fix:** bỏ hẳn `setPointerCapture`, chuyển `pointermove`/`pointerup`/`pointercancel` lên `window`
(vẫn drag mượt ngoài mép rail), và **đóng băng track ngay tại `pointerdown`** (`railTrack.style.transform`
re-pin) trong suốt cú press. `suppressClick` (drag > 8px) giữ nguyên. Không dùng `setTimeout`,
không tắt drag. Rail trên (featured) không có marquee nên không dính bug — giải thích đúng hiện tượng
"rail trên mở được, rail dưới không".

## 2. Nguyên nhân khoảng trắng Work → Capabilities

Cả hai section đều dùng class `.section` với `padding-block: var(--spacing-section)` =
`clamp(5rem, 12vw, 11rem)`. Khoảng cách cộng dồn **bottom padding #work + top padding #capabilities
≈ 2 × 11rem (~352px desktop)**. Không có spacer/margin/thừa từ transform.

**Fix (không margin âm, không đụng layout 2 rail):**
- `#work { padding-bottom: clamp(0.75rem, 1.5vw, 1.25rem); }` (Work.astro scoped style)
- `.caps { padding-top: clamp(1.25rem, 2.5vw, 2rem); }` (Capabilities.astro scoped style)

Khoảng cách thị giác đo được (bottom text rail → số thứ tự Capabilities):
**desktop 1440: 83px · 720–820px: 63–64px · mobile 390: 63px** — nằm trong tham chiếu.

## 3. File đã sửa

| File | Thay đổi |
| --- | --- |
| `src/data/projects.ts` | Thêm field `preview480` (+doc), giữ `preview` = 720p lightbox, `previewMobile` deprecated fallback |
| `src/components/Work.astro` | Card nguồn render `preview480`; media lifecycle (detach/restore); quality policy featured desktop; fix drag/click; marquee pause khi lightbox mở; thu gọn padding `#work` |
| `src/components/Capabilities.astro` | Thu gọn `padding-top` `.caps` |
| `src/components/Hero.astro` | Guard `drafty:lightbox` cho tryPlay; thêm `webkit-playsinline` + `disablePictureInPicture` (kế thừa edit playsinline sẵn có) |
| `src/components/ProcessReel.astro` | Guard `drafty:lightbox`; thêm `webkit-playsinline` + `disablePictureInPicture` + set property trong script |

## 4. Bảng nguồn video trước / sau

Kích thước xác minh bằng **ffprobe trực tiếp trên R2**, không dựa tên file.

| Project | Rail | PC trước | PC sau | Mobile trước | Mobile sau | Lightbox (mọi device) | w×h lightbox / FPS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mb (kz2) | featured | kz2.mp4 720×1280@30 | **kz2-480 480×854@30**¹ | kz2.mp4 | kz2-480 | kz2.mp4 | 720×1280 @30 |
| ai (nox-joy2) | featured | nox-joy2.mp4 720p | **nox-joy2-480**¹ | nox-joy2.mp4 | nox-joy2-480 | nox-joy2.mp4 | 720×1280 @30 |
| leechloe (meitu2) | featured | meitu2.mp4 720p | **meitu2-480**¹ | meitu2.mp4 | meitu2-480 | meitu2.mp4 | 720×1280 @30 |
| testai | featured | testai.mp4 406×720 | **testai-480 480×854**¹ | testai-480 (270×480) | testai-480 (480×854) | testai.mp4 | **720×1280** @30 (re-encode từ master) |
| rail-0404…mate-made (9) | carousel | rail-*.mp4 720×1280@30 | **rail-*-480 480×854@30** | 270-wide 480 (riêng testai) / 720p | rail-*-480 | rail-*.mp4 | 720×1280 @30 |
| doc | carousel | doc.mp4 960×540@**60** | **doc-480 854×480@30** | doc.mp4 | doc-480 | doc.mp4 | **960×540 @30** (re-mux, hạ 60→30fps — xem §5) |

¹ Upgrade lên 720p khi có bằng chứng mạng tốt (xem §6).
Tất cả asset 480p mới: H.264 high@L3.0, CRF 25–26, maxrate 1.1M, AAC 80k (giữ băng thông audio nếu nguồn có), `+faststart`, bitrate trung bình ~366 kbps (testai-480).

## 5. Asset còn thiếu / đã bổ sung

- **Trước audit: KHÔNG tồn tại bất kỳ file `*-480.mp4` nào** ngoài `testai-480` (và file này chỉ 270×480).
  → Đã encode và upload **13 file 480p** lên `draftylab-media/work/` (ffprobe xác minh từng file, bảng trên).
- `testai.mp4` cũ là **406×720** (không phải 720p chuẩn) → re-encode **720×1280@30 CRF23** từ master
  `media for web/TEST AI VIDEO 1.mp4` và ghi đè đúng key trên R2.
- `doc.mp4`: **không có master 720p** — master tốt nhất là chính file 960×540@60 trên R2. Đã re-encode
  960×540@**30** ghi đè để khớp policy "lightbox ≤720p, 30fps" và giảm bitrate (1.85→~0.9 Mbps).
  480p của doc là bản scale từ nguồn đó (854×480@30). Không URL giả, không video đen.
- **Không commit .mp4 vào git** (đã upload trực tiếp bằng `wrangler r2 object put --remote`).

## 6. Chính sách quality

| Bối cảnh | Rule |
| --- | --- |
| Featured desktop | Mặc định **480p30**. Upgrade **một lần, trước play đầu tiên**, lên 720p chỉ khi `navigator.connection`: `effectiveType==='4g'` **và** `downlink≥4` **và** `!saveData` **và** thiết bị desktop (`hover:hover`). Không API (Safari/Firefox) → ở lại 480p. Không speed test. Không đổi quality giữa chừng gây reload. |
| Featured mobile | Luôn 480p30. |
| Carousel PC/mobile | Luôn 480p30. |
| Lightbox (mọi device) | Luôn `preview` 720p30 — `data-full`, không fallback 480 nếu 720 hợp lệ. |

Kiểm chứng Playwright với `navigator.connection` giả lập: 3g→480p, 4g+Save-Data→480p, 4g nhanh desktop→720p.

## 7. Quản lý media khi lightbox mở/đóng (exclusive loading)

`Work.astro` là media coordinator duy nhất; Hero + ProcessReel nhận event `drafty:lightbox`.

**OPEN:** snapshot trạng thái từng video nền vào `WeakMap` (chỉ lần detach đầu — idempotent, chống
mất src khi mở→đóng→mở nhanh) → `detachVideo()`: gỡ `src` của video **và mọi `<source>` con**,
`pause()`, `preload='none'`, rồi **`load()` SAU KHI đã detach** (hủy resource selection; gọi `load()`
khi src còn gắn sẽ tạo request mới). Poster + aspect card giữ nguyên (poster thuộc attribute, không bị
 gỡ). Marquee rAF dừng (`idle` thêm `!lbOpen()`). Lightbox gắn `data-full` 720p và play ưu tiên tuyệt đối —
không chờ nền.
**WHILE OPEN:** mọi handler nền (`play`, `mouseenter/focusin`, `soundOn`, IntersectionObserver featured,
`visibilitychange`, tryPlay của Hero/ProcessReel) đều guard `lbOpen()` → không resume, không re-src,
không fetch khi scroll/resize/duplicate rail.
**CLOSE:** pause + detach lightbox (`removeAttribute('src')` + `load()`) → `restoreBackgroundMedia()`:
video **trong viewport (2 trục)** attach lại src + muted play ngay; video ngoài viewport **không attach,
không load** — observe bởi một `resumeIO` chung, chỉ khôi phục khi thật sự cuộn vào. Sau đó dispatch
`drafty:lightbox open:false`, marquee resume, focus trả về card (`lastFocus`), body scroll unlock.

## 8. Network QA (Playwright + request interception, Chrome)

| Thời điểm | Kết quả |
| --- | --- |
| Trước mở | 24 video nền có currentSrc, preview 480p bình thường |
| Khi mở (featured & carousel) | **0 request .mp4 nền mới** trong 3s; 24/24 video nền: `src` removed, `preload=none`, paused. Lightbox đúng 720p (`kz2.mp4`, `rail-hanoi.mp4`…) |
| Khi đóng | Không request storm: chỉ ~11 request 480p của video in-view (1 trục + ngang), video ngoài viewport không tải |
| Chu kỳ mở/đóng nhanh ×2 | Không mất src, 9/10 in-view playing, 0 pageerror |

*(Không tuyên bố thu hồi byte đã vào cache — mục tiêu là dừng request đang chạy + không phát sinh mới, đạt.)*

## 9. Playwright desktop/mobile/breakpoints

| # | Test | 1440×900 | 390×844 (touch) | 720/820 |
| --- | --- | --- | --- | --- |
| 1 | Featured click → lightbox | ✅ | — | — |
| 2 | Carousel click (chuột thật down/up) → lightbox | ✅ | — | — |
| 3 | Carousel drag 60px → không mở | ✅ | (swipe giữ nguyên logic ≤8px) | — |
| 4 | Click sau drag (wait 2.5s) → mở | ✅ | — | — |
| 5 | Mobile tap → lightbox | — | ✅ | — |
| 6 | Open → toàn bộ nền unloaded | ✅ (0/24 src) | ✅ (0/24 src) | — |
| 7 | Close → resume đúng | ✅ | ✅ | — |
| 8 | Featured mobile 480p | — | ✅ `*-480.mp4` | — |
| 9 | Carousel PC/mobile 480p | ✅ | ✅ | ✅ |
| 10 | Lightbox 720p | ✅ | ✅ (`kz2.mp4` 720×1280) | — |
| 11 | iOS inline | ⚠️ xem §11 | ⚠️ | — |
| 12 | Console errors | 0 | 0 | 0 |
| 13 | Build | ✅ `npm run build` (2 lần, sau refactor + sau sửa attr) | | |

Lightbox fit ở 720×900, 820×1180, 900×500 (portrait hẹp): panel trong viewport 2 trục, aspect theo
`videoWidth/videoHeight` (`--lb-ar`), `object-fit: contain`, controls không che video.
Accessibility: Enter mở / Escape đóng / focus trap vào nút đóng / focus trả về card — ✅ (rail + featured).
Regression: Stats replay ✅, Partners không dừng khi hover ✅, hover sound featured ✅, featured 4 cột ✅,
hero autoplay ✅, VI/EN + poster + tag giữ nguyên ✅.

## 10. Build

`npm run build` — **PASS** (2 pages), lần cuối 15:09 sau toàn bộ thay đổi. Không lỗi TypeScript transform
(HMR overlay sạch), 0 console error.

## 11. Chưa xác minh / hạn chế

- **Safari/iOS thật:** mới kiểm ở mức attribute + API (`playsInline=true`, `playsinline`,
  `webkit-playsinline`, `disablePictureInPicture`, không `controls`, không gọi `requestFullscreen`/
  `webkitEnterFullscreen` ở bất kỳ đâu). **Chưa test iPhone thật** — Playwright không mô phỏng native
  fullscreen. Cần xác nhận trên máy thật.
- **Fallback autoplay có tiếng của lightbox:** code retry 1 lần muted rồi hiện nút Play; đường này mới
  test logic bắt caught-reject, chưa test trên Safari thật (nơi autoplay-unmuted bị từ chối thật).
- `doc.mp4` lightbox là 960×540 (master duy nhất tồn tại). Nếu sau này có master ≥720p, chỉ cần encode
  `work/doc.mp4` 1280×720@30 mới ghi đè + cập nhật `preview` trong `projects.ts`.
- Headless Chrome báo `connection.effectiveType==='4g'` mặc định → featured desktop tải 720p trong môi
  trường test; thiết bị người dùng thật có mạng chậm sẽ nhận 480p. Hành vi đúng policy, ghi lại để
  khỏi bất ngờ khi đọc §9.
- Byte đã cache không thu hồi được (xem §8).

## 12. Deploy

**Chưa push/deploy** theo yêu cầu. Sẵn sàng commit khi duyệt:
`Work.astro`, `projects.ts`, `Capabilities.astro`, `Hero.astro`, `ProcessReel.astro`
(lưu ý Hero/ProcessReel chứa phần edit playsinline sẵn có của bạn — mình chỉ sửa indentation lệch và
thêm guard lightbox + thuộc tính iOS).
