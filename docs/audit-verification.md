# Audit verification — Phase 0 (17/10/2026)

Ký hiệu: **VERIFIED** (đã kiểm tra trực tiếp trên máy trong phiên này) · **REPORTED_NOT_VERIFIED** (theo plan cũ, chưa kiểm được) · **MISSING** · **NEEDS_USER_DECISION**.

Chi tiết từng file: [`asset-inventory.md`](asset-inventory.md) (sinh bởi `npm run media:scan`).

## Đường dẫn & hiện trạng

| Mục | Trạng thái | Ghi chú |
|---|---|---|
| `DFL2/` nguồn dữ liệu | VERIFIED | 5 nhóm thư mục + `font/`. Không file nguồn nào bị sửa (kiểm tra mtime trước/sau). |
| `DFL2/website` | VERIFIED — chưa tồn tại lúc audit | Scaffold mới Astro 5.18.2; không có gì bị ghi đè. |
| V1 `Dự án mặc định/draftylab` | VERIFIED, READ-ONLY | 0 file thay đổi sau phiên (`find -newer` mốc thời gian). |
| Công cụ | VERIFIED | node 24.18, ffmpeg/ffprobe (có libvmaf), sharp 0.35.5. Không có `cwebp` (không cần). |

## Media DFL2 — khác với plan cũ

| Plan cũ báo | Thực tế | Trạng thái |
|---|---|---|
| Content & Video Editing Pack: 4 MP4 dọc 720–1080p, 21–57s | 4 MP4: 3× H.264 720×1280 (30.8 / 57.4 / 35.2s), `TEST AI VIDEO 1.mp4` **HEVC** 1080×1920 21.3s | VERIFIED — HEVC đã transcode H.264 |
| dinh house 9 PNG | 9 PNG 1055×1491 | VERIFIED |
| lee chloe 13 PNG + 3 MP4 | **12 PNG** + 3 MP4 | VERIFIED (plan cũ sai 1 ảnh) |
| kazaki 8 PNG + 3 MP4 (1 ngang) | 8 PNG + 3 MP4, `kazaki2.mp4` 1920×1080 60fps | VERIFIED |
| goodci ảnh/video | 12 PNG (tới 22MB, 3000×3750) + 3 MP4 | VERIFIED |
| winnie ảnh/video lớn | **0 ảnh**, 5 MP4 102–173s, 150–263MB | VERIFIED |
| marie ảnh/video lớn | **0 ảnh**, 5 MP4 83–181s, 127–274MB | VERIFIED |
| porche ảnh | 9 JPG (tới 6000px, 21MB), có ảnh ngang | VERIFIED |
| **Tổng video Social** | **19** (Lee Chloe 3, Kazaki 3, Goodci 3, Winnie 5, Marie 5) | VERIFIED — test tự động khoá con số này |
| raw.MP4 ~10s 4:3 | HEVC 2688×2016, **rotation −90°** → hiển thị dọc 2016×2688, 10.5s | VERIFIED (Phase 2) |
| video final.mp4 ~45s 9:16 | H.264 576×1024, 45.2s | VERIFIED (Phase 2) |
| AI workflow raw.png + final.png | raw **345×373** vs final 1920×2400 — tỉ lệ khác (0.925 vs 0.8) | VERIFIED — NEEDS_USER_DECISION cho Compare Slider (Phase 2) |
| Case Studies 3 PNG chưa rõ tên | 3 PNG ~500×400, tên file không chứa brand | VERIFIED — Phase 2, cần user map |
| Cách tôi sẽ làm việc 10 ảnh + 1 MP4 | 10 ảnh 4032–5712px + `0829(2).mp4` 1080×1920 26s | VERIFIED — Phase 2, cần mapping 4 giai đoạn |
| font: SF Pro Display + FX Parkinsans Bold | 18 file SF-Pro-Display `.otf` + `FX-Parkinsans-Bold.ttf` | VERIFIED |

### Trùng lặp

- `lee chloe/hoi trong.png` **trùng byte-for-byte** (md5 giống nhau) với `Behind the Creative/AI workflow/final.png`. Prototype vẫn giữ trong carousel Lee Chloe. → **NEEDS_USER_DECISION**: đây có đúng là bài đăng của Lee Chloe không?

## Video engine V1

Xem [`v1-media-audit.md`](v1-media-audit.md). Số dòng của plan cũ khớp với code thực tế (markup L76–100, CSS L206–345, `openLightbox/closeLightbox` khoảng L700–760). **VERIFIED.**
Plan cũ ghi "chưa test iOS thật" → vẫn đúng, **chưa test trên thiết bị thật** (xem test-report).

## React Bits

Xem [`react-bits.md`](react-bits.md). Đã lấy cả 8 component từ registry chính thức (`https://reactbits.dev/r/<Name>-TS-CSS.json`, HTTP 200). Preset **Dot Grid Dense** lấy thẳng từ bundle Background Studio. **VERIFIED.**

## Asset tạm từ V1 (`temporaryFromV1`)

| Asset | Nguồn V1 | Dùng ở V2 | Trạng thái |
|---|---|---|---|
| `logo.webp/png`, `logo-mark.png` | `public/media/` | Header, footer, favicon → `public/media/v1-temp/` | V1_TEMP — TODO thay khi có logo V2 |
| `portrait-founder.webp` (688×960) | `ảnh founder/Untfasfafsfaitled-1.png` (DFL2) | Lanyard + thẻ tĩnh Hero + thẻ About | V1_TEMP — ảnh do người dùng cung cấp, có sẵn chữ "MEET THÀNH NGUYỄN / DRAFTY LAB"; cần chân dung sạch nếu muốn |
| 7 partner logos | `public/media/partners/` | Đã copy, **chưa dùng** (Trusted By là Phase 2) | V1_TEMP |
| Email/Instagram/Facebook | `src/data/content.ts` (V1) | Footer, thông báo demo của form | V1_TEMP — cần xác nhận |
| Link FB/IG của brand | `src/data/partners.ts` (V1) | Nút platform trên card Social (DinhHouse, Lee Chloe, Kazaki, Goodci, Winnie) | V1_TEMP — Marie/Porche không có link |

Không hotlink tới V1; các file đã được sao chép vào V2.

## MISSING / NEEDS_USER_DECISION

1. **Font:** SF Pro Display (giấy phép Apple, không được phép nhúng web) → không publish. Chưa rõ giấy phép web của FX Parkinsans Bold → **không publish**, prototype dùng font hệ thống. NEEDS_USER_DECISION.
2. **Copy:** headline `Create more. Worry less.` và lead Hero là bản nháp; mô tả từng brand chỉ dùng số đếm thật (ví dụ "12 ảnh · 3 video"). NEEDS_USER_DECISION.
3. **Tiêu đề video gallery:** không có metadata → tạm đặt "Content & Video Editing 01–04", không tự đặt thể loại. NEEDS_USER_DECISION.
4. **Poster video:** frame tự chọn trong khoảng 0.5–3s (tránh khung đen). Xem [`posters-review.html`](posters-review.html). NEEDS_USER_DECISION.
5. **Preset encode** trước khi batch 14 video còn lại: [`encode-quality.md`](encode-quality.md). NEEDS_USER_DECISION.
6. Winnie/Marie chỉ có video dài → carousel toàn poster video. NEEDS_USER_DECISION (chấp nhận / bổ sung ảnh).
7. **Website & Landing Page:** không có asset trong DFL2 → MISSING (`TODO: ASSETS_WEBSITE`).
8. **Founder portrait sạch, logo khách hàng V2, contact chính thức:** MISSING trong DFL2.
9. **Lead backend:** chưa có → form ở chế độ DEMO công khai (Phase 3).

## Phase 2 additions (17/10/2026)

| Item | Status |
|---|---|
| All 23 Phase 1 videos (4 gallery + 19 social) encoded H.264/AAC 720p, `+faststart`, presets from `scripts/encode-presets.json` | VERIFIED — 0 unencoded videos in the public manifest |
| Phase 2 videos (raw.MP4 → portrait 3:4, final 9:16, how-I-work 9:16) encoded | VERIFIED |
| Case Studies images identified by opening them (brand not in file names) | VERIFIED — see `phase2-mapping.md` |
| Contact details in screenshots removed by crop | VERIFIED (test: no phone numbers on the page) |
| Geist (SIL OFL 1.1) is the only published web font; licence read from `@fontsource-variable/geist` metadata, Vietnamese subset present | VERIFIED |
| Website & Landing Page assets | MISSING → section not rendered |
| Decisions still open | `phase2-mapping.md` (13 items) |
