# CONTENT I18N AUDIT — Drafty Lab (DFL2)

> **Mục đích:** kiệt kê mọi nội dung text có thể thay đổi/địch của website hiện tại, làm đầu vào cho việc biên tập + dịch VI/EN ở giai đoạn sau.
> **Trạng thái giai đoạn này:** CHƯA triển khai i18n, CHƯA sửa source, CHƯA dịch.
> **Ngày audit:** 2026-10-19
> **Phạm vi:** source đang render website (`src/`, `functions/`, `public/`, `scripts/` sinh dữ liệu hiển thị). Không tính chữ nằm trong ảnh/video.
> **Site hiện tại:** Astro 5 + React islands + Cloudflare Pages Functions, 2 route: `/` (`src/pages/index.astro`) và 404 (`src/pages/404.astro`).
> **Ngôn ngữ hiện tại:** VI là ngôn ngữ chính, lẫn một số nhãn EN (kicker, tiêu đề phụ, tên nút mặc định của component).

Quy ước cột:

- **Vị trí source:** `đường/dẫn/file:dòng` — dòng của chuỗi gốc (không phải dòng render).
- **Loại text:** Heading · Paragraph · Navigation · Button · Label · Placeholder · Tooltip · Alt text · ARIA · SEO · Message · Item name.
- **Có thể dịch?:** `Có` (phải dịch) · `Không` (giữ nguyên — brand/URL/số liệu) · `Cần xác nhận`.
- Nội dung trong bảng giữ **nguyên văn 100%**, kể cả lỗi chính tả/hoa thường. Xuống dòng được biểu diễn bằng `⏎`.

---

## 0. Global — Layout, SEO, HTML shell

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| global.siteName | Drafty Lab | `src/data/content.ts:7` | Item name | Không | Tên thương hiệu. Dùng ở title, og:site_name, alt logo footer, footer base, aria logo nav |
| global.siteTitle | Drafty Lab — Creative Production Studio | `src/data/content.ts:8` | SEO | Cần xác nhận | `<title>` + `og:title`. Nửa sau là tiếng Anh — cần chốt tagline VI/EN |
| global.siteDescription | Drafty Lab — video editing, social production và creative production cho thương hiệu. | `src/data/content.ts:9` | SEO | Có | `<meta name="description">` + `og:description`. Đang trộn VI/EN |
| global.lang | vi | `src/data/content.ts:10` | SEO (technical) | Có | `<html lang="vi">`. Bản EN phải là `en` |
| global.canonical | https://draftylab.pages.dev/ | `src/layouts/BaseLayout.astro:23` | SEO (URL) | Không | Canonical. Bản EN thường cần URL khác — cần xác nhận chiến lược URL |
| global.ogUrl | https://draftylab.pages.dev/ | `src/layouts/BaseLayout.astro:24` | SEO (URL) | Không | `og:url` |
| global.ogLocale | vi_VN | `src/layouts/BaseLayout.astro:26` | SEO (technical) | Có | `og:locale`. Bản EN → `en_US` |
| global.ogSiteName | {site.name} | `src/layouts/BaseLayout.astro:27` | SEO | Không | Trỏ về `global.siteName` |
| global.ogTitle | {site.title} | `src/layouts/BaseLayout.astro:28` | SEO | Cần xác nhận | Trỏ về `global.siteTitle` |
| global.ogDescription | {site.description} | `src/layouts/BaseLayout.astro:29` | SEO | Có | Trỏ về `global.siteDescription` |
| global.skipLink | Bỏ qua tới nội dung | `src/layouts/BaseLayout.astro:51` | ARIA / a11y link | Có | Skip-link cho bàn phím/AT |
| global.themeColor | #0a0a0a | `src/layouts/BaseLayout.astro:21` | SEO (technical) | Không | Màu, không phải text hiển thị |
| global.robots | index, follow | `src/layouts/BaseLayout.astro:22` | SEO (technical) | Không | Không phải text hiển thị |
| global.robotsTxt | `User-agent: *`⏎`Allow: /`⏎`Sitemap: https://draftylab.pages.dev/sitemap.xml` | `public/robots.txt:1-4` | SEO (technical) | Không | Nếu tách `/en/` phải thêm rule |
| global.sitemap | `<url><loc>https://draftylab.pages.dev/</loc></url>` | `public/sitemap.xml:3` | SEO (technical) | Không | Bản EN cần URL riêng + `hreflang` |

---

## 1. Navigation / Header

Nguồn: `src/data/content.ts` (nhãn) → `src/components/interactive/HeaderNav.tsx` → `PillNav` (React Bits).

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| nav.work | Dự án | `src/data/content.ts:17` | Navigation | Có | href `#work` |
| nav.services | Dịch vụ | `src/data/content.ts:18` | Navigation | Có | href `#social` (nhãn "Dịch vụ" trỏ tới section Social) — cần xác nhận có đúng ý định |
| nav.results | Kết quả | `src/data/content.ts:19` | Navigation | Có | href `#results` |
| nav.about | Giới thiệu | `src/data/content.ts:20` | Navigation | Có | href `#about` |
| nav.cta | Trao đổi thêm | `src/data/content.ts:22` | Button | Có | Mục cuối trong pill, không có href → mở dialog Quick Call |
| nav.logoAria | `${site.name} — về đầu trang` → "Drafty Lab — về đầu trang" | `src/components/interactive/HeaderNav.tsx:55` | ARIA | Có | aria-label của logo |
| nav.ariaLabel | Chính | `src/components/interactive/HeaderNav.tsx:68` | ARIA | Có | aria-label của `<nav>` |
| nav.menuToggleAria | `open ? 'Close menu' : 'Open menu'` → "Open menu" / "Close menu" | `src/components/react-bits/PillNav.tsx:857` | ARIA | Có | **Hardcode tiếng Anh trong component**, hiện đang render khi nav thu gọn (mobile). Cần tách ra content |
| nav.langLabel | Ngôn ngữ | `src/data/content.ts:252` | ARIA | Có | Nhãn của nút chuyển ngôn ngữ + của menu (2026-10-19, UI-only) |
| nav.langCurrentAria | `${languages.label}: ${current.name}` → "Ngôn ngữ: Tiếng Việt" | `src/components/interactive/LangSwitcher.tsx:110` | ARIA | Có | aria-label của nút, ghép từ 2 key trên |
| nav.langOptionNames | Tiếng Việt · English · Français · Deutsch · Nederlands | `src/data/content.ts:257-261` | Item name | Không | Tên ngôn ngữ viết bằng **chính ngôn ngữ đó** (endonym) — chuẩn quốc tế, không dịch |
| nav.langOptionCodes | VI · EN · FR · DE · NL | `src/data/content.ts:257-261` | Label | Không | Mã ISO hiện cạnh tên và trong nút |
| nav.langFlags | 🇻🇳 · 🇺🇸 · 🇫🇷 · 🇩🇪 · 🇳🇱 | `src/data/content.ts:257-261` | Label (emoji) | Không | Cờ emoji (Apple trên macOS/iOS; Windows/Android hiện thành cặp chữ) |
| nav.langNote | Bản dịch đang được chuẩn bị. | `src/data/content.ts:254` | Message | Có | Chỉ hiện trong menu khi ngôn ngữ đang chọn ≠ `vi` — vì **chưa có bản dịch nào** (xem §24) |

> Nút chuyển ngôn ngữ hiện là **UI-only**: chọn ngôn ngữ sẽ lưu vào `localStorage` (`dfl-lang`) + đổi `<html lang>`, nhưng nội dung trang **vẫn tiếng Việt**. Khi i18n được duyệt, đây là nơi gắn bộ chuyển ngôn ngữ thật.

---

## 2. Hero Section

Nguồn: `src/data/content.ts` → `src/components/sections/Hero.astro` + `HeroLanyard.tsx`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| hero.eyebrow | Drafty Lab · Marketing Partner | `src/data/content.ts:28` | Label | Cần xác nhận | Trộn brand (giữ) + "Marketing Partner" (có thể dịch) |
| hero.title.line1 | Giải pháp Marketing | `src/data/content.ts:30` | Heading | Có | Dòng 1 của `<h1>`. Cỡ chữ tự co theo bề rộng cột (`8cqi`) — câu dài hơn ⇒ chữ nhỏ hơn |
| hero.title.line2 | Cho doanh nghiệp của bạn. | `src/data/content.ts:30` | Heading | Có | Dòng 2 của `<h1>` |
| hero.lead | Quay, kịch bản, đăng bài, đo lường, quảng cáo — làm thương hiệu có quá nhiều việc. Drafty Lab mang đến một quy trình sản xuất nội dung có hệ thống để bạn tập trung vào kinh doanh. | `src/data/content.ts:32` | Paragraph | Có | Đoạn mô tả dưới tiêu đề |
| hero.cta | Trao đổi ngay | `src/data/content.ts:34` | Button | Có | Nút trắng trong hero (mở Quick Call). **Trùng chuỗi** với `qc.cta` nhưng là 2 key riêng |
| hero.portraitAlt | Thành Nguyễn — Founder & Creative Lead, Drafty Lab | `src/data/content.ts:35` | Alt text | Cần xác nhận | alt của ảnh chân dung hero; chứa chức danh (xem `about.card.role`). **Trùng lặp**: chuỗi y hệt hardcode ở `src/components/sections/AboutFounder.astro:17` |

---

## 3. Brand / Client Marquee — "Trusted by"

Nguồn: `src/data/content.ts` + `src/data/partners.ts` → `TrustedBy.astro` (mobile CSS marquee) + `PartnerLoop.tsx` (desktop LogoLoop).

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| trusted.caption | Đối tác tin cậy của chủ doanh nghiệp, Content Creator và Brands | `src/data/content.ts:71` | Paragraph | Có | Dòng chữ trên dải logo (2 bản: CSS marquee + LogoLoop `ariaLabel`) |
| trusted.partnerNames | Kazaki Ramen · Lee Chloe Coffee · Good Ci · Maison · Dinh House · Winnie | `src/data/partners.ts:16-21` | Item name | Không | 6 đối tác, dùng làm `alt`/`title`/`aria-label`. Không dịch tên brand |
| trusted.partnerAlt | `alt={p.name}` (mobile) / `alt`+`title` (desktop) | `src/components/sections/TrustedBy.astro:30`, `src/components/interactive/PartnerLoop.tsx:62-64` | Alt text | Không | Trỏ về `trusted.partnerNames` |

---

## 4. Video Editing / Content Production

Nguồn: `src/data/content.ts` (`gallery`) + `src/data/media.public.json` (sinh tự động) → `VideoGallery.astro`, `VideoPosterCard.astro`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| gallery.kicker | 01 — Video Editing | `src/data/content.ts:40` | Label | Có | Còn tiếng Anh + số thứ tự (các section khác đã bỏ số) |
| gallery.title | Sản xuất Nội dung | `src/data/content.ts:41` | Heading | Có | `<h2 id="vg-title">` |
| gallery.lead | Rê chuột hoặc bấm vào video để xem trước, bấm ⤢ để xem đầy đủ. | `src/data/content.ts:42` | Paragraph | Có | Hướng dẫn tương tác (chứa ký tự ⤢) |
| gallery.card01 | Content creator | `src/data/content.ts:47` | Item name | Cần xác nhận | Ghi đè tiêu đề card 1 (`gallery-v01`) |
| gallery.card02 | Tổ hợp giải trí phòng riêng | `src/data/content.ts:48` | Item name | Cần xác nhận | Card 2 (`gallery-v02`) |
| gallery.card03 | Nhà hàng Fnb | `src/data/content.ts:49` | Item name | Cần xác nhận | Card 3 (`gallery-v03`). "Fnb" viết thường — giữ nguyên văn |
| gallery.card04 | Showroom | `src/data/content.ts:50` | Item name | Cần xác nhận | Card 4 (`gallery-v04`) |
| gallery.play | Xem video | `src/data/content.ts:52` | ARIA / Label | Có | Dùng trong aria-label của card (`Xem video: <title> (<duration>)`) |
| gallery.expand | Xem đầy đủ | `src/data/content.ts:53` | ARIA / Label | Có | aria-label nút ⤢ |
| gallery.notReady | Chưa sẵn sàng | `src/data/content.ts:54` | Label | Có | Badge video chưa encode. **Trùng chuỗi** với `dialog.pendingBadge` (hardcode ở `DialogShell.astro:23`) |
| gallery.pendingNote | Bản xem web của video này sẽ được xử lý sau khi duyệt prototype. | `src/components/media/DialogShell.astro:24` | Message | Có | **Hardcode trong Astro**, không nằm trong `content.ts` |
| gallery.mediaTitleFallback | Content & Video Editing 01 · 02 · 03 · 04 | `src/data/media.public.json:8,26,44,62` (sinh từ `scripts/lib/public-manifest.mjs:64`) | Item name | Cần xác nhận | Tiêu đề gốc do build sinh; **đã bị ghi đè** bởi `gallery.card01-04` trong `VideoGallery.astro:9`. Nếu chạy lại `media:build` mà không ghi đè, chuỗi này quay lại |
| gallery.mediaAlt | Ảnh đại diện video Content & Video Editing 01 · 02 · 03 · 04 | `src/data/media.public.json:9,27,45,63` (sinh từ `scripts/lib/public-manifest.mjs:64`) | Alt text | Có | alt thật của poster 4 video (dùng cho lightbox + AT) |
| gallery.duration | `fmtDuration()` → "0:30" · "0:57" · "0:35" · "0:21" | `src/lib/media.ts:51-55` | Label (technical) | Không | Sinh từ metadata video |

---

## 5. Social Production

Nguồn: `src/data/content.ts` (`social`) + `src/data/media.public.json` → `SocialProduction.astro` → `SocialCarousel.tsx` (CircularCarousel).

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| social.kicker | Sản xuất Nội dung Social | `src/data/content.ts:59` | Label | Có | Kicker (đã mất số thứ tự "02 —") |
| social.title | Ấn phầm truyền thông | `src/data/content.ts:60` | Heading | Có | `<h2 id="sp-title">` |
| social.brandNames | DinhHouse · Lee Chloe · Kazaki · Goodci · Winnie · Marie · Porche | `scripts/lib/config.mjs:25-31` → `src/data/media.public.json` (`brands[].displayName`) | Item name | Không | 7 brand trong config; chỉ 5 brand có ảnh thực sự vào ring (Winnie, Marie rỗng) |
| social.photoTitle | `<Brand> · Bài đăng 0N` (vd "Goodci · Bài đăng 07") | `src/data/media.public.json:81,97,…` (sinh từ `scripts/lib/public-manifest.mjs:76`) | Item name / Tooltip | Có | Tooltip TiltedCard + aria của card carousel |
| social.photoAlt | `Bài đăng 0N của <Brand>` (vd "Bài đăng 07 của Goodci") | `src/data/media.public.json:82,98,…` (sinh từ `scripts/lib/public-manifest.mjs:77`) | Alt text | Có | 20 ảnh Social (dinhhouse 1, leechloe 6, kazaki 3, goodci 7, porche 3) |
| carousel.ariaLabel | Image carousel | `src/components/react-bits/CircularCarousel.tsx:979` | ARIA | Có | **Hardcode tiếng Anh**, render thật (vùng `role="region"`) |
| carousel.slideAria | `${item.title \|\| item.alt \|\| `Image ${index+1}`}, ${index+1} of ${count}` | `src/components/react-bits/CircularCarousel.tsx:1009` | ARIA | Có | Phần `, N of M` là tiếng Anh hardcode; phần đầu lấy từ `social.photoTitle` |
| carousel.live | `${label}, ${active+1} of ${count}` | `src/components/react-bits/CircularCarousel.tsx:1033` | ARIA (live region) | Có | `label` = title/alt ảnh hiện tại; `, N of M` hardcode |

---

## 6. Behind the Creative

Nguồn: `src/data/content.ts` (`behind`) + `scripts/media-roles.json` → `BehindCreative.astro`, `CompareSlider.tsx`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| behind.kicker | hậu trường | `src/data/content.ts:76` | Label | Có | Viết thường trong source, CSS `text-transform` hiển thị "HẬU TRƯỜNG" |
| behind.title | Làm việc sáng tạo | `src/data/content.ts:77` | Heading | Có | `<h2 id="bc-title">` |
| behind.rawFinalTitle | Từ ý tưởng đến set quay | `src/data/content.ts:79` | Heading (h3) | Có | Tiêu đề nhóm RAW/FINAL |
| behind.previewRawAria | Xem trước cảnh quay thô | `src/data/content.ts:82` | ARIA | Có | aria-label card RAW |
| behind.previewFinalAria | Xem trước video hoàn thiện | `src/data/content.ts:83` | ARIA | Có | aria-label card FINAL |
| behind.aiTitle | AI Workflow | `src/data/content.ts:86` | Heading (h3) | Cần xác nhận | Giữ EN hay dịch ("Quy trình AI") |
| behind.sliderAria | So sánh ảnh gốc và poster hoàn thiện | `src/data/content.ts:87` | ARIA | Có | aria-label của compare slider |
| behind.mediaTitles | RAW · FINAL · BEFORE · AFTER | `scripts/media-roles.json:6,12,18,24` | Item name | Cần xác nhận | 4 nhãn IN HOA trên card (RAW/FINAL có card; BEFORE/AFTER là nhãn trong slider) |
| behind.mediaAlts | Cảnh quay thô trước khi dựng · Video hoàn thiện sau khi dựng · Ảnh gốc của ly đồ uống trước khi xử lý AI · Poster hoàn thiện sau khi xử lý AI | `scripts/media-roles.json:7,13,19,25` | Alt text | Có | Alt của 4 media Behind |
| behind.compareLabels | BEFORE / AFTER | `src/components/sections/BehindCreative.astro:41-42` | Label | Cần xác nhận | **Hardcode trong Astro** (không qua content.ts) — nhãn 2 bên ảnh compare |

---

## 7. Case Studies + Results

Nguồn: `src/data/content.ts` (`cases`) + `scripts/media-roles.json` → `CaseStudies.astro`, `CaseVideoCard.tsx`, `TiltedCard`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| cases.kicker | 05 — Case Studies + Results | `src/data/content.ts:93` | Label | Có | Còn tiếng Anh |
| cases.title | Kết quả đạt được | `src/data/content.ts:94` | Heading | Có | `<h2 id="cs-title">` |
| cases.lead | Những thương hiệu đã đồng hành sản xuất nội dung cùng Drafty Lab. | `src/data/content.ts:95` | Paragraph | Có | Dòng mô tả dưới tiêu đề |
| cases.brandNames | DINH House · Kazaki · Goodci · Lee Chloe Coffee | `src/data/content.ts:108-111` | Item name | Không | Tooltip mockup (dùng `name` + `followers`) |
| cases.followers | 12K · 10,4K · 6,3K · 5,9K | `src/data/content.ts:108-111` | Data (số liệu) | Không | Số liệu từ ảnh chụp trang — không đổi khi dịch |
| cases.tooltipTemplate | `${name} · ${followers} người theo dõi` → "DINH House · 12K người theo dõi" | `src/components/sections/CaseStudies.astro:38` | Tooltip | Có | **Hardcode template trong Astro**, chỉ phần "người theo dõi" cần dịch |
| cases.screenshotAlts | Ảnh chụp trang Facebook của Lee Chloe Coffee · Ảnh chụp trang Instagram của Kazaki · Ảnh chụp trang Instagram của Goodci · Ảnh chụp trang Facebook của DINH House | `scripts/media-roles.json:31,43,55,67` | Alt text | Có | Alt 4 mockup |
| cases.videoPlatforms | TikTok · Instagram | `src/data/content.ts:119-121` | Item name | Không | Tên nền tảng + chip trên card |
| cases.videoViews | 378,9K · 114K · 42,3K | `src/data/content.ts:119-121` | Data (số liệu) | Không | Số liệu từ bài đăng |
| cases.videoCreators | @decejenni21 · @winnie_wakanda · @sarayaabdoul.stlaurent | `src/data/content.ts:119-121` | Item name | Không | Tài khoản tác giả bài đăng |
| cases.viewsLabel | lượt xem | `src/data/content.ts:124` | Label | Có | aria-label của số view (`378,9K lượt xem`) |
| cases.videoCta | `Xem trên ${platform}` → "Xem trên TikTok" / "Xem trên Instagram" | `src/data/content.ts:125` | Button | Có | Nút mở bài đăng gốc |
| cases.videoAria | `Xem video trên ${platform}, ${views} lượt xem (mở tab mới)` | `src/data/content.ts:126` | ARIA | Có | aria-label nút mở bài gốc |
| cases.playerLabels | Phát video · Tạm dừng · Tắt tiếng · Bật tiếng · Tua video | `src/data/content.ts:127` | ARIA | Có | Nút play/pause/mute/seek của card video |
| cases.videoMediaTitles | Reel Instagram — 42,3K lượt xem · Reel Instagram — 114K lượt xem · Video TikTok — 378,9K lượt xem | `scripts/media-roles.json:133,139,145` | Item name | Có | Tiêu đề media (dùng cho lightbox/aria) |
| cases.videoMediaAlts | Khung hình từ video Instagram Reel, 42,3K lượt xem · Khung hình từ video Instagram Reel, 114K lượt xem · Khung hình từ video TikTok, 378,9K lượt xem | `scripts/media-roles.json:134,140,146` | Alt text | Có | Alt poster 3 video |

---

## 8. How I Work

Nguồn: `src/data/content.ts` (`howIWork`) + `scripts/media-roles.json` → `HowIWork.astro`, `ProcessFolder.tsx`, `Folder`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| hw.kicker | 06 — How I Work | `src/data/content.ts:133` | Label | Có | Còn tiếng Anh |
| hw.title | Quy trình làm việc | `src/data/content.ts:134` | Heading | Có | `<h2 id="hw-title">` |
| hw.stage01Name | Phân tích nhu cầu, mục tiêu và tệp khán giả | `src/data/content.ts:141` | Item name | Có | `<h3 class="hw__name">` bước 1 |
| hw.stage01Blurb | Tìm hiểu mục tiêu kinh doanh, sản phẩm và tệp khán giả trước khi bắt tay vào làm. | `src/data/content.ts:141` | Paragraph | Có | Mô tả bước 1 |
| hw.stage02Name | Lên kế hoạch và triển khai | `src/data/content.ts:142` | Item name | Có | Bước 2 |
| hw.stage02Blurb | Lên kế hoạch nội dung, chuẩn bị thiết bị và triển khai quay theo đúng kế hoạch. | `src/data/content.ts:142` | Paragraph | Có | |
| hw.stage03Name | Lên lịch đăng bài | `src/data/content.ts:143` | Item name | Có | Bước 3 |
| hw.stage03Blurb | Thiết kế, hoàn thiện nội dung và lên lịch đăng bài cho từng kênh. | `src/data/content.ts:143` | Paragraph | Có | |
| hw.stage04Name | Báo cáo và thống kê | `src/data/content.ts:144` | Item name | Có | Bước 4 |
| hw.stage04Blurb | Theo dõi số liệu, tổng hợp báo cáo và tối ưu cho các chiến dịch tiếp theo. | `src/data/content.ts:144` | Paragraph | Có | |
| hw.folderAria | `Mở thư mục ${name}` → "Mở thư mục Phân tích nhu cầu, mục tiêu và tệp khán giả" | `src/data/content.ts:135` (dùng ở `ProcessFolder.tsx:44`) | ARIA | Có | aria-label của folder |
| hw.folderName | `${label} folder` → "Phân tích nhu cầu, mục tiêu và tệp khán giả folder" | `src/components/react-bits/Folder.tsx:2156` | ARIA | Có | **Hardcode tiếng Anh** ("folder") trong component |
| hw.photoTitles | Trao đổi với khách hàng · Tìm hiểu yêu cầu · Họp với khách hàng · Lịch kế hoạch · Chuẩn bị quay · Thiết bị quay · Triển khai kế hoạch · Thiết kế bài đăng · Lên lịch đăng bài · Trang kế hoạch nội dung · Tổng hợp nội dung | `scripts/media-roles.json:77,82,87,92,97,102,107,112,117,122,127` | Item name | Có | Tiêu đề 11 ảnh (giấy trong folder + lightbox) |
| hw.photoAlts | Khung hình cuộc gọi video trao đổi với khách hàng · Làm việc tại bàn với laptop đang mở tài liệu · Gọi video với khách hàng qua Google Meet trên laptop · Lịch tháng trên Google Calendar dùng để lên kế hoạch · Quay sản phẩm bằng điện thoại gắn gimbal · Máy ảnh và gimbal chuẩn bị cho buổi quay · Laptop và cà phê trong buổi làm việc tại quán · Thiết kế poster bài đăng trên laptop · Lên lịch đăng bài trên Meta Business Suite · Trang kế hoạch nội dung trên màn hình laptop · Màn hình laptop đang mở tài liệu tổng hợp nội dung | `scripts/media-roles.json:78,83,88,93,98,103,108,113,118,123,128` | Alt text | Có | Alt 11 ảnh |

---

## 9. About the Founder

Nguồn: `src/data/content.ts` (`about`) → `AboutFounder.astro` + `FounderCard.tsx`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| about.kicker | 07 — About the Founder | `src/data/content.ts:150` | Label | Có | Còn tiếng Anh |
| about.title | Giới thiệu bản thân | `src/data/content.ts:151` | Heading | Có | `<h2 id="ab-title">` |
| about.intro | Xin chào! Mình là Thành. | `src/data/content.ts:152` | Paragraph | Có | Chỉ hiển thị ≥900px (mobile ẩn) |
| about.body1 | Mình là `<strong>`Creative Producer và Founder của Drafty Lab`</strong>`, tập trung vào `<strong>`sáng tạo nội dung, sản xuất hình ảnh và phát triển trải nghiệm kỹ thuật số cho thương hiệu`</strong>`. | `src/data/content.ts:156` | Paragraph (HTML) | Có | **Chứa thẻ `<strong>`** — bản dịch phải giữ cấu trúc. Render ở 2 nơi: `AboutFounder.astro:13` (desktop) + `FounderCard.tsx:33` (mobile) |
| about.body2 | Mình kết hợp tư duy thẩm mỹ, khả năng kể chuyện và công nghệ AI để tạo ra những sản phẩm sáng tạo mang bản sắc riêng, truyền tải đúng thông điệp và phục vụ mục tiêu kinh doanh. | `src/data/content.ts:157` | Paragraph (HTML) | Có | Như trên (2 nơi render) |
| about.cardName | Thành Nguyễn | `src/data/content.ts:159` | Item name | Không | Tên người trên card |
| about.cardRole | Founder & Creative Lead | `src/data/content.ts:159` | Item name | Cần xác nhận | Chức danh — giữ EN hay dịch? Cũng xuất hiện trong `hero.portraitAlt` và `AboutFounder.astro:17` |
| about.cardBadge | Drafty Lab | `src/data/content.ts:159` | Alt text | Không | alt của logo wordmark trong card (`FounderCard.tsx:23`) |
| about.tag01 | Marketing Partner | `src/data/content.ts:160` | Label | Cần xác nhận | Pill tag dưới chức danh |
| about.tag02 | AI Hybrid Production | `src/data/content.ts:160` | Label | Cần xác nhận | Pill tag |
| about.portraitAlt | Thành Nguyễn — Founder & Creative Lead, Drafty Lab | `src/components/sections/AboutFounder.astro:17` | Alt text | Cần xác nhận | **Hardcode, trùng y hệt `hero.portraitAlt`** — nên gộp thành 1 key |

---

## 10. Quick Call in 10 Min — CTA + Form

Nguồn: `src/data/content.ts` (`quickCall`) + `src/data/lead-options.ts` → `QuickCallCTA.astro`, `QuickCallButton.tsx`, `QuickCallForm.tsx`, `Stepper`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| qc.title | Quick Call in 10 Min | `src/data/content.ts:164` | Heading | Cần xác nhận | Tiêu đề section CTA + tiêu đề dialog (`DialogShell.astro:6`) |
| qc.cta | Trao đổi ngay | `src/data/content.ts:165` | Button | Có | Nút lớn (StarBorder). **Trùng chuỗi** với `hero.cta` |
| qc.subtitle | Trả lời 4 câu nhanh — phần lớn chỉ cần bấm chọn. | `src/data/content.ts:166` | Paragraph | Có | Đầu form |
| qc.demoBanner | Form demo — chưa nhận lead thật | `src/data/content.ts:167` | Message | Có | Chỉ hiện khi thiếu `PUBLIC_LEAD_ENDPOINT` (local/dev) |
| qc.demoBadge | DEMO | `src/components/interactive/QuickCallForm.tsx:135` | Label | Cần xác nhận | **Hardcode trong TSX**, đứng trước `qc.demoBanner` |
| qc.back | Quay lại | `src/data/content.ts:168` | Button | Có | Nút Stepper |
| qc.next | Tiếp tục | `src/data/content.ts:169` | Button | Có | Nút Stepper |
| qc.submit | Gửi yêu cầu | `src/data/content.ts:170` | Button | Có | Nút Stepper bước cuối |
| qc.sending | Đang gửi… | `src/data/content.ts:213` | Button (state) | Có | Thay chữ nút khi đang POST |
| qc.step1Title | Lĩnh vực | `src/data/content.ts:173` | Label (step) | Có | Tiêu đề bước 1 |
| qc.step1Question | Bạn đang kinh doanh lĩnh vực nào? | `src/data/content.ts:174` | Label | Có | Câu hỏi bước 1 |
| qc.step2Title | Nhu cầu | `src/data/content.ts:178` | Label (step) | Có | Bước 2 |
| qc.step2Question | Bạn đang cần hỗ trợ gì nhất? | `src/data/content.ts:179` | Label | Có | |
| qc.step2Hint | Chọn một hoặc nhiều | `src/data/content.ts:180` | Label | Có | Gợi ý chọn nhiều |
| qc.step3Title | Hiện trạng | `src/data/content.ts:184` | Label (step) | Có | Bước 3 |
| qc.step3Question | Hiện bạn đang triển khai content như thế nào? | `src/data/content.ts:185` | Label | Có | |
| qc.budgetQuestion | Ngân sách dự kiến của bạn? | `src/data/content.ts:190` | Label | Có | Câu hỏi tuỳ chọn (nằm cùng bước 3) |
| qc.budgetHint | Không bắt buộc | `src/data/content.ts:191` | Label | Có | Hiện trong ngoặc đơn |
| qc.step4Title | Liên hệ | `src/data/content.ts:195` | Label (step) | Có | Bước 4 |
| qc.contactQuestion | Làm sao để liên hệ với bạn? | `src/data/content.ts:196` | Label | Có | |
| qc.contactName | Tên của bạn | `src/data/content.ts:197` | Label (input) | Có | `<label>` (không dùng placeholder) |
| qc.contactValueLabel | Zalo / số điện thoại hoặc email của bạn | `src/data/content.ts:201` | Label (input) | Có | 1 ô nhận SĐT **hoặc** email |
| qc.contactValueError | Số điện thoại hoặc email chưa hợp lệ. | `src/data/content.ts:202` | Message (error) | Có | |
| qc.contactNote | Ghi chú (không bắt buộc) | `src/data/content.ts:203` | Label (textarea) | Có | |
| qc.contactNameError | Vui lòng nhập tên. | `src/data/content.ts:204` | Message (error) | Có | |
| qc.industryOptions | F&B / Restaurant · Brand / E-commerce · Agency / Marketing · Creator / Personal Brand · Khác | `src/data/lead-options.ts:3` | Label (choice) | Có | **Whitelist dùng chung với server** (`lead-schema.ts`) — dịch là phải đổi cả 2 phía + dữ liệu lead cũ trong D1 |
| qc.needsOptions | Video Editing · Social Content · Social Media Production · Website / Landing Page · Branding / AI Creative · Chưa rõ, cần tư vấn | `src/data/lead-options.ts:4` | Label (choice) | Có | Như trên (whitelist server) |
| qc.teamOptions | Tự làm · Có 1–2 người hỗ trợ · Có team 3+ người · Đã thuê ngoài nhưng chưa hiệu quả · Đang tìm đối tác dài hạn | `src/data/lead-options.ts:5` | Label (choice) | Có | Như trên |
| qc.budgetOptions | Dưới 5 triệu · 5 – 15 triệu · 15 – 30 triệu · Trên 30 triệu · Chưa xác định | `src/data/lead-options.ts:7` | Label (choice) | Có | Như trên. DRAFT — chờ chủ site chốt giá |
| qc.demoResult | Đây là bản demo: yêu cầu CHƯA được gửi đi và Drafty Lab chưa nhận được thông tin của bạn. Vui lòng liên hệ trực tiếp qua email bên dưới. | `src/data/content.ts:207` | Message | Có | |
| qc.errorResult | Không gửi được yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp. | `src/data/content.ts:208` | Message (error) | Có | |
| qc.rateLimited | Bạn đã gửi khá nhiều yêu cầu. Vui lòng thử lại sau vài phút hoặc liên hệ trực tiếp. | `src/data/content.ts:209` | Message (error) | Có | |
| qc.captchaFailed | Chưa xác minh được bạn là người thật. Vui lòng thử lại. | `src/data/content.ts:210` | Message (error) | Có | Dùng ở 2 chỗ: captcha không tải được + submit bị 403 |
| qc.invalidResult | Một số thông tin chưa hợp lệ. Vui lòng kiểm tra lại các ô đã nhập. | `src/data/content.ts:211` | Message (error) | Có | |
| qc.disabledResult | Form tạm ngưng nhận yêu cầu. Vui lòng liên hệ trực tiếp. | `src/data/content.ts:212` | Message (error) | Có | |
| qc.retry | Thử lại | `src/data/content.ts:214` | Button | Có | |
| qc.successTitle | Đã nhận yêu cầu liên hệ | `src/data/content.ts:215` | Message (success) | Có | |
| qc.successBody | Drafty Lab sẽ liên hệ lại với bạn qua phương thức bạn đã chọn. | `src/data/content.ts:216` | Message (success) | Có | |
| qc.turnstileLang | vi | `src/components/interactive/TurnstileBox.tsx:55` | Technical (locale) | Có | `language: 'vi'` của widget Cloudflare Turnstile — bản EN phải là `en` |
| qc.stepperStepAria | `Step ${number}: ${title}` → "Step 1: Lĩnh vực" | `src/components/react-bits/Stepper.tsx:477` | ARIA | Có | **Hardcode tiếng Anh** trong component |
| qc.dialogFallbackTitle | Quick Call | `src/scripts/dialog-bootstrap.js:139` | Label | Cần xác nhận | Tiêu đề dialog khi chưa có React (`shell.dataset.quickcallTitle || 'Quick Call'`); bình thường lấy `qc.title` |
| qc.stepperDefaults | Back · Continue · Complete | `src/components/react-bits/Stepper.tsx:185-187` | Button | Có | Mặc định EN của component — hiện **không render** vì form truyền `qc.back/next/submit`. Nếu thiếu prop ở tương lai sẽ lộ ra |

---

## 11. Footer

Nguồn: `src/data/content.ts` (`footer`, `contact`) → `Footer.astro`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| footer.line | Drafty Lab — Đối tác Marketing sáng tạo. | `src/data/content.ts:228` | Paragraph | Có | Dòng dưới logo |
| footer.email | thanhnguyenphotowork@gmail.com | `src/data/content.ts:221` | Data (liên hệ) | Không | mailto + nhãn hiển thị. Cũng dùng trong QuickCallForm (2 chỗ) + DialogShell + email notify |
| footer.instagramUrl | https://www.instagram.com/thanh.poto.des/ | `src/data/content.ts:223` | Data (URL) | Không | Link IG của founder |
| footer.facebookUrl | https://fb.com/realthanhng | `src/data/content.ts:224` | Data (URL) | Không | Link Facebook |
| footer.platformLabels | Instagram · Facebook | `src/components/Footer.astro:15-16` | Item name | Không | Tên nền tảng — kèm logo (Gmail/IG/FB) vẽ inline trong `Footer.astro` |
| footer.logoAlt | Drafty Lab | `src/components/Footer.astro:8` | Alt text | Không | Trỏ về `global.siteName` |
| footer.copyright | `© {year} Drafty Lab` → "© 2026 Drafty Lab" | `src/components/Footer.astro:18` | Label | Không | Năm tự động |
| footer.note | (rỗng — không render) | `src/data/content.ts:229` | Label | Có | Chuỗi rỗng, có điều kiện render; hiện không hiển thị gì |

---

## 12. Lightbox / Modal / Carousel (chung)

Nguồn: `src/data/content.ts` (`dialog`, `volume`) + `DialogShell.astro`, `VideoLightbox.tsx`, `ImageLightbox.tsx`, `VolumeOverlay.tsx`, `dialog-bootstrap.js`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| dialog.close | Đóng | `src/data/content.ts:233` | ARIA / Button | Có | aria-label nút X (`DialogShell.astro:12`) |
| dialog.loading | Đang mở… | `src/data/content.ts:234` | Message (loading) | Có | Placeholder khi dialog mở mà React chưa vào |
| dialog.buffering | Đang tải video… | `src/data/content.ts:235` | Message (loading) | Có | Truyền làm `label` cho LatticeLoader (spinner video) |
| dialog.failed | Không tải được nội dung. Bạn có thể đóng cửa sổ này và thử lại. | `src/data/content.ts:236` | Message (error) | Có | Sau 8s không có React host |
| dialog.play | Phát | `src/data/content.ts:237` | ARIA | Có | |
| dialog.pause | Tạm dừng | `src/data/content.ts:238` | ARIA | Có | |
| dialog.mute | Tắt tiếng | `src/data/content.ts:239` | ARIA | Có | |
| dialog.unmute | Bật tiếng | `src/data/content.ts:240` | ARIA | Có | |
| dialog.seek | Tua video | `src/data/content.ts:241` | ARIA | Có | aria-label thanh tua |
| dialog.prev | Mục trước | `src/data/content.ts:242` | ARIA | Có | Nút điều hướng media trong nhóm |
| dialog.next | Mục sau | `src/data/content.ts:243` | ARIA | Có | |
| dialog.mutedNotice | Trình duyệt đang phát không tiếng — bấm để bật tiếng | `src/data/content.ts:244` | Message | Có | Nút + live region khi Safari chặn autoplay có tiếng |
| dialog.videoControlsAria | Điều khiển video | `src/components/media/VideoLightbox.tsx:147` | ARIA | Có | **Hardcode trong TSX** (aria-label của nhóm điều khiển) |
| dialog.contactPrefix | Liên hệ trực tiếp: | `src/components/media/DialogShell.astro:35` | Label | Có | **Hardcode trong Astro** (trước email) |
| dialog.pendingBadge | Chưa sẵn sàng | `src/components/media/DialogShell.astro:23` | Label | Có | **Hardcode, trùng `gallery.notReady`** |
| dialog.loaderAnnounce | `${label}, in progress` → "Đang tải video…, in progress" | `src/components/react-bits/LatticeLoader.tsx:157` | ARIA (live) | Có | Nửa sau hardcode EN; cũng có `Done in` / `Failed after` (`LatticeLoader.tsx:103-104`) chưa dùng tới |
| dialog.counter | `{index+1} / {count}` → "2 / 4" | `src/components/media/VideoLightbox.tsx:214`, `ImageLightbox.tsx:38` | Label (technical) | Không | Bộ đếm ảnh/video |
| dialog.timecode | `${fmtTime(cur)} / ${fmtTime(dur)}` → "0:12 / 0:30" | `src/components/media/VideoLightbox.tsx:169` | Label (technical) | Không | |
| volume.label | Âm lượng | `src/data/content.ts:249` | ARIA | Có | aria-label của SloshGauge |
| volume.caption | Âm lượng | `src/data/content.ts:250` | Label | Có | Chú thích dưới gauge |

---

## 13. Trang 404

Nguồn: `src/pages/404.astro`.

| ID | Nội dung hiện tại | Vị trí source | Loại text | Có thể dịch? | Ghi chú |
|---|---|---|---|---|---|
| nf.title | Không tìm thấy trang | `src/pages/404.astro:13` | Heading | Có | `<h1>` |
| nf.text | Đường dẫn này không tồn tại hoặc đã được chuyển đi. | `src/pages/404.astro:14` | Paragraph | Có | |
| nf.home | Về trang chủ | `src/pages/404.astro:15` | Button | Có | Link về `/` (bản EN phải về `/en/`) |
| nf.kicker | 404 | `src/pages/404.astro:12` | Label | Không | Số, không cần dịch |

---

## 14. Cross-reference — Button / CTA

Không phát sinh text mới; đây là danh sách để rà soát đồng bộ giọng điệu.

| Nhãn hiện tại | ID | Render ở |
|---|---|---|
| Trao đổi ngay | `hero.cta` + `qc.cta` (2 key, cùng chuỗi) | `Hero.astro:22`, `QuickCallButton.tsx:29` |
| Trao đổi thêm | `nav.cta` | `HeaderNav.tsx:57` |
| Quay lại / Tiếp tục / Gửi yêu cầu / Đang gửi… / Thử lại | `qc.back` / `qc.next` / `qc.submit` / `qc.sending` / `qc.retry` | `QuickCallForm.tsx:153-155, 294` |
| Xem video / Xem đầy đủ | `gallery.play` / `gallery.expand` | `VideoPosterCard.astro:19, 33` |
| Xem trên TikTok / Xem trên Instagram | `cases.videoCta` | `CaseStudies.astro:72` |
| Về trang chủ | `nf.home` | `404.astro:15` |

---

## 15. Cross-reference — Placeholder / Tooltip

| Loại | Nội dung | Vị trí | Ghi chú |
|---|---|---|---|
| Placeholder input | *(không có)* | `QuickCallForm.tsx:229-266` | Toàn bộ input dùng `<label>` thật, **không dùng** thuộc tính `placeholder` — không có text placeholder nào cần dịch |
| Tooltip mockup Case Studies | `${name} · ${followers} người theo dõi` | `CaseStudies.astro:38` → `TiltedCard.tsx:541` (`aria-label`) | Xem `cases.tooltipTemplate` |
| Tooltip ảnh Social | `<Brand> · Bài đăng 0N` | `SocialBrandCard.tsx:72` (parked) / `CircularCarousel` (hiện dùng) | Xem `social.photoTitle` |
| Tooltip logo đối tác (desktop) | `title={p.name}` (tên brand) | `PartnerLoop.tsx:64` | Tên brand, không dịch |
| Tooltip aria fallback | `logo link` | `LogoLoop.tsx:1221` | Chỉ dùng khi item không có alt/title — với dữ liệu hiện tại luôn lấy tên brand |

---

## 16. Cross-reference — Loading / Empty / Error / Success

| Trạng thái | Nội dung | ID | Vị trí render |
|---|---|---|---|
| Loading dialog | Đang mở… | `dialog.loading` | `DialogShell.astro:31` |
| Loading video | Đang tải video… (+ ", in progress" hardcode) | `dialog.buffering` + `dialog.loaderAnnounce` | `VideoLightbox.tsx:208`, `LatticeLoader.tsx:157` |
| Loading nút gửi | Đang gửi… | `qc.sending` | `QuickCallForm.tsx:155` |
| Loading poster video | *(spinner CSS thuần, không chữ)* | — | `VideoPosterCard.astro:297` |
| Empty (video chưa encode) | Chưa sẵn sàng + "Bản xem web…" | `gallery.notReady` / `dialog.pendingBadge` / `gallery.pendingNote` | `VideoPosterCard.astro:43`, `DialogShell.astro:23-24` |
| Empty (Social không có ảnh) | *(section chỉ còn tiêu đề — không có chữ thay thế)* | — | `SocialProduction.astro:12,18` |
| Error dialog | Không tải được nội dung… + "Liên hệ trực tiếp:" + email | `dialog.failed` / `dialog.contactPrefix` | `DialogShell.astro:34-35` |
| Error form (network) | Không gửi được yêu cầu… | `qc.errorResult` | `QuickCallForm.tsx:290` |
| Error form (400) | Một số thông tin chưa hợp lệ… | `qc.invalidResult` | `QuickCallForm.tsx:290` |
| Error form (429) | Bạn đã gửi khá nhiều yêu cầu… | `qc.rateLimited` | `QuickCallForm.tsx:290` |
| Error form (403/captcha) | Chưa xác minh được bạn là người thật… | `qc.captchaFailed` | `QuickCallForm.tsx:273,290` |
| Error form (503) | Form tạm ngưng nhận yêu cầu… | `qc.disabledResult` | `QuickCallForm.tsx:290` |
| Demo (không có endpoint) | DEMO + Form demo — chưa nhận lead thật + Đây là bản demo… | `qc.demoBadge` / `qc.demoBanner` / `qc.demoResult` | `QuickCallForm.tsx:135,281` |
| Success | Đã nhận yêu cầu liên hệ + Drafty Lab sẽ liên hệ lại… | `qc.successTitle` / `qc.successBody` | `QuickCallForm.tsx:168-169` |

---

## 17. Cross-reference — SEO / Meta

| Thẻ | Nguồn | ID |
|---|---|---|
| `<title>` | `BaseLayout.astro:19` | `global.siteTitle` |
| `meta description` | `BaseLayout.astro:20` | `global.siteDescription` |
| `og:title` / `og:description` / `og:site_name` | `BaseLayout.astro:27-29` | `global.*` |
| `og:locale` | `BaseLayout.astro:26` | `global.ogLocale` |
| `og:url` / `canonical` | `BaseLayout.astro:23-24` | `global.canonical` |
| `html lang` | `BaseLayout.astro:15` | `global.lang` |
| robots.txt / sitemap.xml | `public/robots.txt`, `public/sitemap.xml` | `global.robotsTxt` / `global.sitemap` |

---

## 18. Cross-reference — Accessibility (aria-label / alt)

| Nhóm | Số lượng | ID liên quan |
|---|---|---|
| ARIA nhãn nút/điều khiển (dialog, player, gauge) | 11 | `dialog.*`, `volume.label`, `cases.playerLabels` |
| ARIA vùng/landmark (nav, region, group, carousel, folder) | 8 | `nav.ariaLabel`, `nav.logoAria`, `nav.menuToggleAria`, `dialog.videoControlsAria`, `carousel.ariaLabel`, `carousel.slideAria`, `carousel.live`, `hw.folderAria`, `hw.folderName` |
| ARIA mô tả hành động (Xem video, Xem đầy đủ, Xem trên …, Mở thư mục …, Xem trước …) | 6 | `gallery.play`, `gallery.expand`, `cases.videoAria`, `cases.videoCta`, `hw.folderAria`, `behind.previewRawAria`, `behind.previewFinalAria`, `behind.sliderAria` |
| Alt ảnh/video (hero, about, gallery, social, behind, case studies, how-i-work, logo, partner) | 8 nhóm (~40 chuỗi) | `hero.portraitAlt`, `about.portraitAlt`, `about.cardBadge`, `footer.logoAlt`, `gallery.mediaAlt`, `social.photoAlt`, `behind.mediaAlts`, `cases.screenshotAlts`, `cases.videoMediaAlts`, `hw.photoAlts`, `trusted.partnerAlt` |
| Skip-link | 1 | `global.skipLink` |

---

## 19. Text sinh tự động từ media pipeline

Các chuỗi dưới đây **không nằm trong `content.ts`** mà do script build sinh ra `src/data/media.public.json`. Muốn dịch phải sửa ở nguồn sinh (hoặc ghi đè trong `content.ts` như `gallery.itemTitles`).

| Nguồn sinh | File:dòng | Chuỗi sinh ra | Số lượng |
|---|---|---|---|
| Template gallery | `scripts/lib/public-manifest.mjs:64` | `Content & Video Editing NN` + `Ảnh đại diện video Content & Video Editing NN` | 4 + 4 |
| Template social | `scripts/lib/public-manifest.mjs:76-77` | `<Brand> · Bài đăng NN` / `Bài đăng NN của <Brand>` | 20 + 20 |
| Tên brand (config) | `scripts/lib/config.mjs:25-31` | `DinhHouse · Lee Chloe · Kazaki · Goodci · Winnie · Marie · Porche` | 7 |
| Tên bước How I Work (config) | `scripts/lib/config.mjs:48-51` | `Phân tích nhu cầu · Lên kế hoạch · Lên lịch đăng bài · Báo cáo` | 4 (chỉ dùng làm id, không hiển thị) |
| Title/alt thủ công (phase 2) | `scripts/media-roles.json` | Toàn bộ title/alt của Behind, Case Studies, How I Work | 34 (17 title + 17 alt) |

> ⚠️ `scripts/lib/config.mjs:56-63`: 50 ảnh Social đã được chủ site chuyển sang `Social Production/ảnh riêng` nhưng manifest + file trong `public/media/v2/social/**` vẫn còn → **chạy lại `media:scan` + `media:build` sẽ xoá hết text social** (mục `social.photoTitle`/`social.photoAlt` sẽ biến mất). Không chạy 2 lệnh này cho tới khi chốt phương án.

---

## 20. Phân loại A / B / C

### A. Nội dung cần dịch VI/EN

- Toàn bộ `hero.*`, `nav.*` (trừ brand), `gallery.*` (trừ tên riêng), `social.kicker/title`, `behind.*`, `cases.*`, `hw.*`, `about.title/intro/body1/body2`, `qc.*`, `footer.line`, `dialog.*`, `volume.*`, `nf.*`, `global.skipLink/lang/ogLocale/siteDescription`.
- Toàn bộ ARIA/alt có chữ mô tả (xem §18), gồm cả `nav.langLabel` / `nav.langCurrentAria` của nút chuyển ngôn ngữ.
- Message loading/error/success/demo (xem §16), gồm cả `nav.langNote` ("Bản dịch đang được chuẩn bị.").
- Title/alt sinh từ `scripts/media-roles.json` (Behind, Case Studies, How I Work) và template social.

### B. Nội dung nên giữ nguyên

- `Drafty Lab` (siteName, cardBadge, footer logo alt, footer copyright).
- Tên 6 đối tác (`partners.ts`), tên 7 brand Social (`config.mjs`), tên brand trong Case Studies.
- `Thành Nguyễn`, `thanhnguyenphotowork@gmail.com`, link IG/FB, URL canonical/og:url, sitemap.
- Số liệu: `12K · 10,4K · 6,3K · 5,9K · 378,9K · 114K · 42,3K`, @handle tác giả, duration video, `404`.
- Tên nền tảng (`TikTok`, `Instagram`, `Facebook`, `Zalo`, `Meta Business Suite`, `Google Meet`, `Google Calendar`).
- Ký hiệu/đơn vị: `01 —`, `©`, `⤢`, `·`, `—`.
- Nút chuyển ngôn ngữ: tên ngôn ngữ viết bằng chính ngôn ngữ đó (`Tiếng Việt · English · Français · Deutsch · Nederlands`), mã ISO (`VI/EN/FR/DE/NL`) và cờ emoji (`🇻🇳 🇺🇸 🇫🇷 🇩🇪 🇳🇱`).

### C. Nội dung cần chủ site xác nhận

1. `global.siteTitle` / tagline "Creative Production Studio" — có giữ EN ở bản VI không?
2. `global.canonical` + chiến lược URL (`/en/` vs subdomain) và `hreflang`.
3. `hero.eyebrow` "Drafty Lab · Marketing Partner" — dịch "Marketing Partner"?
4. `about.cardRole` "Founder & Creative Lead" (lặp ở `hero.portraitAlt` + `AboutFounder.astro:17`) — giữ EN hay dịch? Gộp 3 chỗ thành 1 key?
5. `about.tag01/tag02` "Marketing Partner" / "AI Hybrid Production" — giữ EN hay dịch?
6. `behind.aiTitle` "AI Workflow" và `behind.mediaTitles` RAW/FINAL/BEFORE/AFTER.
7. `qc.title` "Quick Call in 10 Min" — tên riêng của dịch vụ?
8. `qc.demoBadge` "DEMO" và `qc.dialogFallbackTitle` "Quick Call".
9. `gallery.kicker` "01 — Video Editing", `cases.kicker` "05 — Case Studies + Results", `hw.kicker` "06 — How I Work", `about.kicker` "07 — About the Founder", `trusted.kicker` "Trusted by" — còn EN, và **số thứ tự đã lệch** (Social/Behind mất "02 —"/"04 —").
10. 4 tên dự án gallery (`Content creator`, `Tổ hợp giải trí phòng riêng`, `Nhà hàng Fnb`, `Showroom`) — có phải tên khách hàng/dự án phải giữ nguyên?
11. Bộ chọn trong form (`INDUSTRIES/NEEDS/TEAMS/BUDGETS`) — nằm trong whitelist dùng chung client + server + D1: dịch thì phải có kế hoạch cho dữ liệu lead cũ.
12. `behind.compareLabels` BEFORE/AFTER (hardcode `BehindCreative.astro:41-42`).
13. Nút chuyển ngôn ngữ: dòng `nav.langNote` "Bản dịch đang được chuẩn bị." — chờ bạn chốt câu chữ; và **site có nên phát hành nút này khi chưa có bản dịch không** (xem cảnh báo ở §25).

---

## 21. Phụ lục A — Nội dung KHÔNG còn được dùng (dead content)

Không render ở bất kỳ route nào hiện tại. Giữ lại để tránh dịch nhầm, hoặc để dọn khi triển khai i18n.

| Nội dung | Vị trí source | Ghi chú |
|---|---|---|
| Explore My Work | `src/data/content.ts:33` (`hero.primaryCta`) | Không có CTA thứ 2 nào render (hero chỉ render `secondaryCta`) |
| Mở menu | `src/data/content.ts:23` (`nav.menuOpen`) | PillNav tự hardcode "Open menu" (`PillNav.tsx:857`) |
| Đóng menu | `src/data/content.ts:24` (`nav.menuClose`) | Như trên |
| Trusted by | `src/data/content.ts:70` (`trusted.kicker`) | Section chỉ render `trusted.title` |
| Thương hiệu trước / Thương hiệu sau | `src/data/content.ts:61-62` (`social.railPrev/railNext`) | Chỉ dùng ở `SocialBrandRail.tsx:297,300` — component **đã bị thay bằng** `SocialCarousel` (parked, không import) |
| `Bài trước của ${brand}` / `Bài sau của ${brand}` | `src/data/content.ts:63-64` (`social.postPrev/postNext`) | Không nơi nào dùng |
| Rê chuột vào để nghe | `src/data/content.ts:65` (`social.mute`) | Không nơi nào dùng |
| Các thương hiệu Social Production | `src/components/interactive/SocialBrandRail.tsx:306` | Hardcode trong component parked |
| Set quay / Sản phẩm hoàn thiện | `src/data/content.ts:80-81` (`behind.rawFinal.rawLabel/finalLabel`) | Không nơi nào dùng |
| Đã sản xuất · Người theo dõi hiện tại · `Theo ảnh chụp trang ${platform}, 18/10/2026` · Quy mô tài khoản tại thời điểm chụp… · Mở trang | `src/data/content.ts:96-100` (`cases.scopeLabel/sizeLabel/sizeSource/sizeCaveat/visit`) | Section Case Studies hiện chỉ hiện ảnh + tooltip tên/follower |
| Valley / Portrait / Towers / Swell / Facade / Pose / Night / Street (+ alt/subtitle) | `src/components/react-bits/CircularCarousel.tsx:21-80` (`DEFAULT_ITEMS`) | Fallback ảnh Unsplash — không dùng vì `SocialCarousel.tsx:18` luôn truyền `items` |
| Alexander Doe · Senior Developer · Verified · Active · ID number | `src/components/react-bits/ReflectiveCard.tsx:663-668` | Mặc định của component; `FounderCard.tsx:61` truyền `children` nên bị thay hoàn toàn |
| Back / Continue / Complete | `src/components/react-bits/Stepper.tsx:185-187` | Bị ghi đè bởi `qc.back/next/submit` |
| Thinking / Done in / Failed after | `src/components/react-bits/LatticeLoader.tsx:102-104` | Chỉ `label` được truyền; `doneLabel/errorLabel` chưa dùng |
| Slides / Go to slide N / Depth carousel / `N of M` | `src/components/react-bits/DepthCarousel.tsx:169,541,571,588,606,613` | Component DepthCarousel **không được import** ở đâu |
| Image N / Image carousel | `src/components/react-bits/CircularCarousel.tsx:917,979` | Phần `Image N` chỉ là fallback khi item thiếu title/alt |
| Partner logos / logo link / Level / Main / Folder | `LogoLoop.tsx:1104,1221`, `SloshGauge.tsx:106`, `PillNav.tsx:213`, `Folder.tsx:2156` | Mặc định component; hiện được ghi đè (trừ "folder", "Open/Close menu" là **đang render**) |
| Media v1-temp (logo, portrait, partner logo) | `public/media/v1-temp/**` | Asset tạm từ V1 — không phải text, nhưng ghi chú vì liên quan bản EN |
| `saraya.webp` | `public/media/v1-temp/partners/saraya.webp` | Đối tác đã bị xoá khỏi `partners.ts` — file còn trên disk |

---

## 22. Phụ lục B — Text không thuộc UI website (email/thông báo nội bộ)

Không hiển thị cho khách truy cập, nhưng là chữ do hệ thống sinh. Nếu muốn EN hoá toàn bộ thì phải xử lý riêng (không cùng file ngôn ngữ với web).

| Nội dung | Vị trí source | Ghi chú |
|---|---|---|
| `[DFL2] New Lead – ${name}` | `functions/_lib/notify.ts:30` | Tiêu đề email lead |
| `Có yêu cầu Quick Call in 10 Min mới từ website Drafty Lab (DFL2).` | `functions/_lib/notify.ts:35` | Dòng đầu email |
| `Tên: …` / `Liên hệ qua ${method}: …` / `Lĩnh vực kinh doanh: …` / `Dịch vụ quan tâm: …` / `Hiện trạng triển khai content: …` / `Ngân sách dự kiến: …` / `Ghi chú: …` | `functions/_lib/notify.ts:37-43` | Nhãn trong email |
| `Thời gian gửi: …` / `Mã lead: …` / `Nguồn: …` | `functions/_lib/notify.ts:45-47` | |
| `Lead cũng được lưu trong Cloudflare D1 (bảng leads) để dự phòng.` | `functions/_lib/notify.ts:48` | |
| `Zalo / Phone` · `Email` · `Instagram` | `functions/_lib/notify.ts:21` (`METHOD_LABEL`) | Nhãn phương thức liên hệ |
| `(không chọn)` · `(không có)` | `functions/_lib/notify.ts:42-43` | Giá trị rỗng |
| `Drafty Lab Leads <onboarding@resend.dev>` | `wrangler.toml` (`LEAD_FROM_EMAIL`, cả `[vars]` và `[env.preview.vars]`) | Tên người gửi |
| Mã lỗi API: `method · disabled · origin · type · too_large · bad_json · invalid · captcha · rate_limited · server · duplicate` | `functions/_lib/lead-handler.ts:49-111` | Trả về JSON cho client, không phải chữ hiển thị |
| `Điều khiển video` (aria) — xem `dialog.videoControlsAria` | `src/components/media/VideoLightbox.tsx:147` | Thuộc UI, đã liệt kê ở §12 |

---

## 23. Bảng tổng kết

Số liệu dưới đây được đếm trực tiếp từ các bảng ở §0–§13 (không tính bảng cross-reference §14–§18, Phụ lục A/B và phần đề xuất key).

| Chỉ số | Giá trị |
|---|---|
| Tổng số text phát hiện (đang render, §0–§13) | **183** |
| — Cần dịch (`Có`) | **134** |
| — Giữ nguyên (`Không`) | **31** |
| — Cần xác nhận (`Cần xác nhận`) | **18** |
| Số section đã kiểm tra | **14** (Global 15 · Nav 14 · Hero 6 · Trusted 3 · Video 14 · Social 7 · Behind 10 · Case Studies 16 · How I Work 14 · About 11 · Quick Call 41 · Footer 8 · Lightbox/Modal 20 · 404 4) + 5 bảng cross-reference |
| Text dead / không render (Phụ lục A) | 30 mục (gồm 5 chuỗi media v1-temp, 1 file asset) |
| Text ngoài UI website (Phụ lục B) | 8 nhóm |
| Component chưa kiểm tra được (không render, không có text hiển thị) | `GlassSurface`, `GradualBlur`, `AnimatedContent`, `FadeContent`, `Lanyard`, `SideRays`, `DotGrid`, `StarBorder`, `CountUp`, `DepthCarousel` — đã rà, **không chứa text hiển thị** |
| Chuỗi hardcode cần tách sang file ngôn ngữ | **12** (xem danh sách dưới) |

### 23.1 Nội dung đang hardcode (ngoài `content.ts`) — cần tách khi làm i18n

| # | Chuỗi | File:dòng |
|---|---|---|
| 1 | `Bản xem web của video này sẽ được xử lý sau khi duyệt prototype.` | `src/components/media/DialogShell.astro:24` |
| 2 | `Chưa sẵn sàng` (badge pending) | `src/components/media/DialogShell.astro:23` |
| 3 | `Liên hệ trực tiếp:` | `src/components/media/DialogShell.astro:35` |
| 4 | `Điều khiển video` (aria) | `src/components/media/VideoLightbox.tsx:147` |
| 5 | `${name} · ${followers} người theo dõi` (tooltip) | `src/components/sections/CaseStudies.astro:38` |
| 6 | `BEFORE` / `AFTER` (nhãn compare) | `src/components/sections/BehindCreative.astro:41-42` |
| 7 | `Thành Nguyễn — Founder & Creative Lead, Drafty Lab` (alt, lặp `hero.portraitAlt`) | `src/components/sections/AboutFounder.astro:17` |
| 8 | `Chính` (aria nav) | `src/components/interactive/HeaderNav.tsx:68` |
| 9 | `DEMO` | `src/components/interactive/QuickCallForm.tsx:135` |
| 10 | `Open menu` / `Close menu` (aria) | `src/components/react-bits/PillNav.tsx:857` |
| 11 | `Các thương hiệu Social Production` (aria, component parked) | `src/components/interactive/SocialBrandRail.tsx:306` |
| 12 | `${languages.label}: ${current.name}` (aria-label nút ngôn ngữ) | `src/components/interactive/LangSwitcher.tsx:110` |

Hardcode trong React Bits (nên xử lý bằng props, không sửa component):

| # | Chuỗi | File:dòng | Trạng thái |
|---|---|---|---|
| 12 | `Step ${n}: ${title}` | `src/components/react-bits/Stepper.tsx:477` | Đang render |
| 13 | `${label}, in progress` · `Done in` · `Failed after` | `src/components/react-bits/LatticeLoader.tsx:157,103-104` | Đang render (phần `in progress`) |
| 14 | `${label} folder` · `Folder` | `src/components/react-bits/Folder.tsx:2156` | Đang render |
| 15 | `Image carousel` · `, N of M` | `src/components/react-bits/CircularCarousel.tsx:979,1009,1033` | Đang render |
| 16 | `Partner logos` · `logo link` | `src/components/react-bits/LogoLoop.tsx:1104,1221` | Đã ghi đè / fallback |
| 17 | `Level` | `src/components/react-bits/SloshGauge.tsx:106` | Đã ghi đè |
| 18 | `Main` | `src/components/react-bits/PillNav.tsx:213` | Đã ghi đè |
| 19 | `Slides` · `Go to slide N` · `Depth carousel` | `src/components/react-bits/DepthCarousel.tsx` | Không dùng |
| 20 | `Image N` | `src/components/react-bits/CircularCarousel.tsx:917` | Fallback |

---

## 24. Đề xuất cấu trúc key cho `vi.json` / `en.json`

**Chưa tạo file, chưa dịch.** Chỉ đề xuất cách tổ chức, giữ đúng namespace của audit này để map 1-1.

```jsonc
{
  "global":   { "siteName", "siteTitle", "siteDescription", "lang", "ogLocale", "skipLink" },
  "nav":      { "work", "services", "results", "about", "cta", "logoAria", "ariaLabel", "menuToggleAria",
                "langLabel", "langNote", "langCurrentAria": "{label}: {name}",
                "langOptions": { "vi": { "name", "short", "flag" }, "en": {…}, "fr": {…}, "de": {…}, "nl": {…} } },
  "hero":     { "eyebrow", "title": { "line1", "line2" }, "lead", "cta", "portraitAlt" },
  "trusted":  { "caption", "partnerNames": { "kazaki", "leechloe", "goodci", "maison", "dinhhouse", "winnie" } },
  "gallery":  { "kicker", "title", "lead", "play", "expand", "notReady", "pendingNote",
                "cards": { "gallery-v01", "gallery-v02", "gallery-v03", "gallery-v04" } },
  "social":   { "kicker", "title", "brands": { "<brandId>": "…" } },
  "behind":   { "kicker", "title",
                "rawFinal": { "title", "previewRawAria", "previewFinalAria" },
                "ai": { "title", "sliderAria" },
                "media": { "<mediaId>": { "title", "alt" } } },
  "cases":    { "kicker", "title", "lead", "viewsLabel",
                "videoCta": "Xem trên {platform}",
                "videoAria": "Xem video trên {platform}, {views} lượt xem (mở tab mới)",
                "player": { "play", "pause", "mute", "unmute", "seek" },
                "tooltip": "{name} · {followers} người theo dõi",
                "items":  { "<id>": { "name", "followers" } },
                "videos": { "<id>": { "platformName", "views", "creator" } },
                "media":  { "<mediaId>": { "title", "alt" } } },
  "howIWork": { "kicker", "title", "folderAria": "Mở thư mục {name}", "folderName": "{name} folder",
                "stages": { "audience": { "name", "blurb" }, "plan": {…}, "schedule": {…}, "report": {…} },
                "media":  { "<mediaId>": { "title", "alt" } } },
  "about":    { "kicker", "title", "intro", "body1", "body2",
                "card": { "name", "role", "badge" }, "tags": { "tag01", "tag02" }, "portraitAlt" },
  "quickCall": { "title", "cta", "subtitle", "demoBanner", "demoBadge",
                 "back", "next", "submit", "sending", "retry",
                 "steps": { "industry": { "title", "question", "options": [] },
                            "needs":    { "title", "question", "hint", "options": [] },
                            "team":     { "title", "question", "options": [] },
                            "budget":   { "question", "hint", "options": [] },
                            "contact":  { "title", "question", "name", "valueLabel", "valueError", "note", "nameError" } },
                 "messages": { "demoResult", "errorResult", "rateLimited", "captchaFailed",
                               "invalidResult", "disabledResult", "successTitle", "successBody" },
                 "stepperStepAria": "Step {n}: {title}", "turnstileLang", "dialogFallbackTitle" },
  "footer":   { "line", "platformLabels": { "instagram", "facebook" }, "copyright": "© {year} {siteName}" },
  "dialog":   { "close", "loading", "buffering", "failed", "play", "pause", "mute", "unmute", "seek",
                "prev", "next", "mutedNotice", "videoControlsAria", "contactPrefix", "pendingBadge",
                "loaderAnnounce": "{label}, in progress", "loaderDone": "Done in", "loaderError": "Failed after" },
  "volume":   { "label", "caption" },
  "notFound": { "kicker", "title", "text", "home" },
  "media":    { "<mediaId>": { "title", "alt" } }   // nhóm gom cho title/alt sinh tự động (tuỳ chọn)
}
```

Ghi chú triển khai (chỉ là gợi ý, chưa thực hiện):

1. **Không dịch `lead-options.ts` một cách độc lập** — các mảng đó là whitelist dùng chung client + server (`src/lib/lead-schema.ts`) và đã nằm trong cột dữ liệu D1 (`leads.industry/needs/team/budget`). Nếu dịch, phải: (a) tách `value` (id ổn định, không đổi) khỏi `label` (chuỗi hiển thị), (b) giữ `value` cũ để dữ liệu cũ vẫn đọc được.
2. **Placeholder dạng biến** (`Xem trên {platform}`, `Mở thư mục {name}`, `{name} · {followers} người theo dõi`) phải giữ nguyên token khi dịch.
3. `about.body1/body2` chứa HTML (`<strong>`) → file ngôn ngữ cần cho phép HTML hoặc chuyển sang mảng segment.
4. Chuỗi dài nhất cần lưu ý layout: `hero.title.line1/line2` (cỡ chữ tự co `8cqi`), `trusted.caption` (1 dòng trên mobile), `hero.lead`.
5. 12 chuỗi hardcode ở §23.1 nên tách sang `content.ts` (hoặc file ngôn ngữ) **trước** khi làm i18n, để mọi text đi qua một đường.
6. Cần thêm `hreflang` + `canonical` riêng cho bản EN (chưa có hạ tầng).
7. Nút chuyển ngôn ngữ đã có sẵn trong header (`src/components/interactive/LangSwitcher.tsx`): khi i18n được duyệt, chỉ cần nối `pick()` với bộ nạp ngôn ngữ + điều hướng route; phần UI/cờ/lưu lựa chọn đã xong. Tên ngôn ngữ và mã ISO (`VI/EN/FR/DE/NL`) không cần dịch.

---

## 25. Trạng thái triển khai đa ngôn ngữ (2026-10-19)

**ĐÃ TRIỂN KHAI XONG** theo bản dịch của chủ site (`ngôn ngữ/CONTENT_I18N_5_LANGUAGES_REVIEW.md`).

| Hạng mục | Trạng thái |
|---|---|
| Ngôn ngữ | `vi` (mặc định, `/`) · `en` `/en/` · `fr` `/fr/` · `de` `/de/` · `nl` `/nl/` |
| Nguồn chuỗi | `src/i18n/strings.json` — 179 ID sinh tự động từ file review bằng `scripts/i18n/parse-review.mjs` (không gõ tay) |
| Chuỗi media | `src/i18n/media.json` — 46 item (title/alt) sinh bởi `scripts/i18n/build-media.mjs`, khớp theo **nội dung VI** nên không phụ thuộc thứ tự quét |
| Truy cập lúc chạy | `getContent(locale)` trong `src/i18n/index.ts` — cùng shape với `src/data/content.ts` (id/href/màu/URL/số liệu vẫn lấy từ đó) |
| Registry | `src/i18n/config.ts` — `LOCALES`, `LOCALE_META` (cờ, mã, `html lang`, `og:locale`, ngôn ngữ Turnstile, nhãn aria), `localePath()` |
| Nút chuyển | Góc phải header: gọn (cờ + mã), menu **không có box** — chỉ cờ + mã, chữ nhỏ, đổ bóng nhẹ; bấm là **điều hướng** sang route của ngôn ngữ đó |
| SEO | canonical + `hreflang` (5 ngôn ngữ + `x-default`) + `og:locale`/`og:locale:alternate` theo từng route; `public/sitemap.xml` có cả 5 URL |
| 404 | `dist/404.html` (VI) + `dist/<lang>/404.html` (4 bản dịch) — `scripts/prepare-dist.mjs` làm phẳng `404/index.html` thành `404.html` cho Cloudflare Pages |
| Form | **label dịch, value giữ nguyên tiếng Việt** (whitelist server `src/lib/lead-schema.ts` + dữ liệu D1 không đổi) |
| Turnstile | `language` lấy theo locale (`qc.turnstileLang`) |
| VI cũ | Không đổi: nav/hero/CTA/tiêu đề section/tên card/kicker/footer/tab folder đều y như trước khi triển khai |

Chuỗi hardcode trước đây đã được đưa vào hệ thống: `nav.menuToggleAria` (PillNav), `qc.stepperStepAria` (Stepper), `hw.folderName` (Folder), `carousel.*` (CircularCarousel), `dialog.loaderAnnounce` (LatticeLoader), `behind.compareLabels`, `cases.tooltipTemplate`, `dialog.videoControlsAria`, `dialog.contactPrefix`, `dialog.pendingBadge`, `gallery.pendingNote`, `qc.demoBadge`.

Lệnh sinh lại dữ liệu (chỉ chạy khi file review đổi):

```
node scripts/i18n/parse-review.mjs   # MD  → src/i18n/strings.json
node scripts/i18n/build-media.mjs    # JSON → src/i18n/media.json
```

### 25.3 Nút CTA trên thẻ video Case Studies — luôn 1 dòng (2026-10-19)

**Yêu cầu:** "mấy cái nút này bất kì ở ngôn ngữ nào đều chỉ đc hiện trong 1 dòng".

**Số đo:** nút rộng bằng thẻ trừ 24px (16px trên điện thoại). Ở 390px thẻ chỉ 114px → chỗ cho chữ ≈ 64px, trong khi nhãn dài nhất ("Auf Instagram ansehen") cần 105px ở cỡ 10,88px. Không cỡ chữ nào vừa 1 dòng mà còn đọc được.

**Cách làm** (`CaseVideoCard.css` + `.tsx`): thẻ trở thành container query.
- `.cvc__cta-t` (câu đầy đủ) `white-space: nowrap` + `font-size: min(0.82rem, calc(9.4cqi - 4px))` → tự co theo bề rộng thẻ, không bao giờ xuống dòng.
- Thẻ < 152px (điện thoại, 3 thẻ/hàng) → đổi sang `.cvc__cta-s` = **tên nền tảng** ("TikTok"/"Instagram"), vẫn 1 dòng; câu đầy đủ vẫn nằm trong `aria-label`.
- Thẻ < 112px → bỏ mũi tên để đủ chỗ.
- Nhãn đầy đủ hiện từ ~559px trở lên (ở 700/1024px đã 1 dòng).

**Kiểm chứng:** 5 ngôn ngữ × 17 kích thước (320→1440px) → tất cả nút đều 1 dòng, không tràn; quét thêm mọi nút khác (`.hbtn`, `.btn`, stepper, pill nav, switcher) ở 5 ngôn ngữ × 8 kích thước → cũng đều 1 dòng.

### 25.2 Lỗi hiển thị mobile (2026-10-19, sau khi lên sóng)

**Triệu chứng:** trên thẻ video Case Studies, nút hiện ra nguyên văn tài liệu —
`Xem trên ${platform}` → "Xem trên TikTok" / "Xem trên Instagram".

**Nguyên nhân:** file review viết các dòng dạng template theo cú pháp *"template → ví dụ đã resolve"*, và cột VI ghi cả **code** chứ không phải giá trị (`cases.videoCta`, `cases.videoAria`, `cases.tooltipTemplate`, `hw.folderAria`, `hw.folderName`, `qc.stepperStepAria`, `dialog.loaderAnnounce`, `carousel.slideAria`, `carousel.live`, `nav.logoAria`, `nav.menuToggleAria`). Parser cũ lấy nguyên ô → trang **tiếng Việt** in ra cả phần tài liệu; 4 ngôn ngữ kia không bị vì cột của họ là template sạch.

**Đã sửa** (`scripts/i18n/parse-review.mjs`): cắt mọi thứ sau ` → `, bỏ `(vd "…")`, bỏ backtick/`**`, đổi `${token}` → `{token}`; 3 dòng cột VI là code (`nav.menuToggleAria`, `carousel.slideAria`, `carousel.live`) được map sang giá trị đúng; thêm **guard** chặn build nếu còn giá trị trông như tài liệu/code (danh sách `NOT_RENDERED` cho các dòng không render). Nhãn nav nay là tiếng Việt "Mở menu / Đóng menu" (trước đó rơi vào chuỗi rác).

### 25.1 Sửa đổi sau khi chủ site duyệt (2026-10-19)

| Yêu cầu | Đã làm |
|---|---|
| "thị trường nước ngoài thì quy đổi thành đô la mỹ nhé, đức thì là tiền của đức" | `qc.budgetOptions` giữ nguyên các mức, chỉ đổi tiền tệ: **EN = USD**, **DE/FR/NL = EUR**, VI vẫn VND. Nằm ở `src/i18n/overrides.ts` (lớp ghi đè, không mất khi sinh lại JSON) |
| "thay bằng thông tin liên hệ của bạn. với thị trường nước ngoài nhé" | `qc.contactValueLabel` + `qc.contactValueError` cho EN/FR/DE/NL đổi thành "contact details" (bỏ Zalo). VI giữ nguyên |
| "cho phép nhập bất kì cái gì cũng đc chứ ko giới hạn như hiện tại" | Ô liên hệ thành **free text**: `CONTACT_METHODS` thêm `other`, `lead-schema.ts` thêm validator `other` (2–120 ký tự), form tự suy ra method (email → phone → instagram → other). **D1 không cần migration** (`method` là TEXT, không có CHECK). Có unit test |
| "sang các ngôn ngữ khác thì không chạy" | Nguyên nhân: dev server Vite **pre-bundle muộn** `motion/react` (CountUp) → `504 Outdated Optimize Dep` → island CaseVideoCard không hydrate → số lượt xem đứng ở 0. Sửa: `optimizeDeps.include: ['motion/react','three']` trong `astro.config.mjs` (chỉ ảnh hưởng dev, không ảnh hưởng bản build) |
| (phát hiện khi rà lại) số đếm dùng dấu `.` ở mọi ngôn ngữ | `CountUp` nhận `decimal`; `CaseVideoCard` truyền dấu theo locale qua `numberSeparators()` → VI/FR/DE/NL hiện `378,9K`, EN hiện `378.9K` |

Ghi chú còn lại:

- Cờ là emoji, nên **hình dạng phụ thuộc hệ điều hành**: macOS/iOS hiện cờ thật (Apple), Windows/Android hiện cặp chữ `VN`/`US`… Muốn giống nhau mọi máy thì phải dùng ảnh/SVG (chưa làm).
- Không còn `localStorage['dfl-lang']`: ngôn ngữ do URL quyết định (tốt cho SEO và chia sẻ link).
- Chuỗi của chính bộ chuyển ngôn ngữ (tên ngôn ngữ, mã, cờ, nhãn aria) nằm ở `src/i18n/config.ts`, không dịch — tên ngôn ngữ luôn viết bằng chính ngôn ngữ đó.
- 19 mục "⚠️ Cần duyệt" trong file review đã được dùng **nguyên văn bản nháp**; chủ site đổi ý thì chỉ cần sửa file review rồi chạy lại 2 lệnh sinh dữ liệu ở trên.
