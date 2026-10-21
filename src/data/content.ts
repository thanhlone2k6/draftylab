// All visible copy lives here. Items marked DRAFT need user approval (see docs/audit-verification.md).
// Contact/links marked temporaryFromV1 come from the V1 project's content.ts / partners.ts.

import { BUDGETS, INDUSTRIES, NEEDS, TEAMS } from './lead-options';

export const site = {
  name: 'Drafty Lab',
  title: 'Drafty Lab — Creative Production Studio',
  description: 'Drafty Lab — video editing, social production và creative production cho thương hiệu.',
  lang: 'vi',
};

// 2026-10-19 (owner): nav labels + CTA are Vietnamese now (Work/Services/Results/About → Dự án/Dịch vụ/
// Kết quả/Giới thiệu; "Let's Talk" → "Trao đổi thêm"). The hero button uses its own string (hero.secondaryCta).
export const nav = {
  links: [
    { label: 'Dự án', href: '#work' },
    { label: 'Dịch vụ', href: '#social' },
    { label: 'Kết quả', href: '#results' },
    { label: 'Giới thiệu', href: '#about' },
  ],
  cta: 'Trao đổi thêm',
  menuOpen: 'Mở menu',
  menuClose: 'Đóng menu',
};

export const hero = {
  eyebrow: 'Drafty Lab · Marketing Partner',
  // 2026-10-19 (owner): the English DRAFT headline became the Vietnamese promise.
  headline: ['Giải pháp Marketing', 'Cho doanh nghiệp của bạn.'],
  // DRAFT, paraphrased from the storyboard direction.
  lead: 'Quay, kịch bản, đăng bài, đo lường, quảng cáo — làm thương hiệu có quá nhiều việc. Drafty Lab mang đến một quy trình sản xuất nội dung có hệ thống để bạn tập trung vào kinh doanh.',
  primaryCta: 'Explore My Work',
  secondaryCta: 'Trao đổi ngay',
  portraitAlt: 'Thành Nguyễn — Founder & Creative Lead, Drafty Lab',
};

export const gallery = {
  id: 'work',
  kicker: '01 — Video Editing',
  title: 'Sản xuất Nội dung',
  lead: 'Rê chuột hoặc bấm vào video để xem trước, bấm ⤢ để xem đầy đủ.',
  // 2026-10-19 (owner): the 4 cards carry the owner's project names. The media build still bakes the
  // placeholder titles ("Content & Video Editing 01–04") into media.public.json, so the overrides live
  // here and are applied in VideoGallery.astro (card caption AND the lightbox data-title).
  itemTitles: {
    'gallery-v01': 'Content creator',
    'gallery-v02': 'Tổ hợp giải trí phòng riêng',
    'gallery-v03': 'Nhà hàng Fnb',
    'gallery-v04': 'Showroom',
  } as Record<string, string>,
  play: 'Xem video',
  expand: 'Xem đầy đủ',
  notReady: 'Chưa sẵn sàng',
};

export const social = {
  id: 'social',
  kicker: 'Sản xuất Nội dung Social',
  title: 'Ấn phầm truyền thông',
  railPrev: 'Thương hiệu trước',
  railNext: 'Thương hiệu sau',
  postPrev: (brand: string) => `Bài trước của ${brand}`,
  postNext: (brand: string) => `Bài sau của ${brand}`,
  mute: 'Rê chuột vào để nghe',
};

export const trusted = {
  id: 'trusted',
  kicker: 'Trusted by',
  title: 'Đối tác tin cậy của chủ doanh nghiệp, Content Creator và Brands',
};

export const behind = {
  id: 'behind',
  kicker: 'hậu trường',
  title: 'Làm việc sáng tạo',
  rawFinal: {
    title: 'Từ ý tưởng đến set quay',
    rawLabel: 'Set quay',
    finalLabel: 'Sản phẩm hoàn thiện',
    previewRaw: 'Xem trước cảnh quay thô',
    previewFinal: 'Xem trước video hoàn thiện',
  },
  ai: {
    title: 'AI Workflow',
    sliderLabel: 'So sánh ảnh gốc và poster hoàn thiện',
  },
};

export const cases = {
  id: 'results',
  kicker: '05 — Case Studies + Results',
  title: 'Kết quả đạt được',
  lead: 'Những thương hiệu đã đồng hành sản xuất nội dung cùng Drafty Lab.',
  scopeLabel: 'Đã sản xuất',
  sizeLabel: 'Người theo dõi hiện tại',
  sizeSource: (platform: string) => `Theo ảnh chụp trang ${platform}, 18/10/2026`,
  sizeCaveat: 'Quy mô tài khoản tại thời điểm chụp, không phải kết quả đo lường của chiến dịch.',
  visit: 'Mở trang',
  // 2026-10-18 (owner): the 4 phone-profile screenshots in `Case Studies + Results/` replace the old
  // ones and the grid is 4-up (mediaId → id drift is guarded in scripts/media-roles.json).
  // Order = highest follower count first, as read from the screenshots.
  // The section now shows IMAGES ONLY, so only `name` + `followers` still reach the page (they are the
  // TiltedCard cursor tooltip); `scopeLabel` / `sizeLabel` / `sizeSource` / `sizeCaveat` / `visit` /
  // `items[].platform` are unused until copy comes back.
  items: [
    { id: 'dinhhouse', name: 'DINH House', platform: 'Facebook', mediaId: 'case-studies-i04', followers: '12K' },
    { id: 'kazaki', name: 'Kazaki', platform: 'Instagram', mediaId: 'case-studies-i02', followers: '10,4K' },
    { id: 'goodci', name: 'Goodci', platform: 'Instagram', mediaId: 'case-studies-i03', followers: '6,3K' },
    { id: 'leechloe', name: 'Lee Chloe Coffee', platform: 'Facebook', mediaId: 'case-studies-i01', followers: '5,9K' },
  ],
  // 2026-10-18 (owner): 3 app-style video cards under the mockups, most views first. Views are read from the
  // owner's screenshots of each post; likes/comments/shares were NOT supplied, so none are shown. `hasAudio`
  // is false for the one source with no audio track (hides the sound button). File↔link pairing is from
  // frames (media-roles.json `role`), confirmed by the owner. `creator` = the account in the post's own URL
  // (og:url of each public page; TikTok handle from the link). `viewsTo`/`viewsDecimals` feed CountUp (compact).
  videos: [
    { id: 'tiktok-378k', platform: 'tiktok' as const, platformName: 'TikTok', mediaId: 'case-studies-v03', views: '378,9K', viewsTo: 378900, viewsDecimals: 1, creator: '@decejenni21', hasAudio: true, url: 'https://www.tiktok.com/@decejenni21/video/7653463775470718228' },
    { id: 'ig-114k', platform: 'instagram' as const, platformName: 'Instagram', mediaId: 'case-studies-v02', views: '114K', viewsTo: 114000, viewsDecimals: 0, creator: '@winnie_wakanda', hasAudio: false, url: 'https://www.instagram.com/reel/Da0OLniBkbM/' },
    { id: 'ig-42k', platform: 'instagram' as const, platformName: 'Instagram', mediaId: 'case-studies-v01', views: '42,3K', viewsTo: 42300, viewsDecimals: 1, creator: '@sarayaabdoul.stlaurent', hasAudio: true, url: 'https://www.instagram.com/reel/Dc7vF90B8Mj/' },
  ],
  videoCopy: {
    viewsLabel: 'lượt xem',
    cta: (platform: string) => `Xem trên ${platform}`,
    aria: (platform: string, views: string) => `Xem video trên ${platform}, ${views} lượt xem (mở tab mới)`,
    play: 'Phát video', pause: 'Tạm dừng', mute: 'Tắt tiếng', unmute: 'Bật tiếng', seek: 'Tua video',
  },
};

export const howIWork = {
  id: 'process',
  kicker: '06 — How I Work',
  title: 'Quy trình làm việc',
  openLabel: (name: string) => `Mở thư mục ${name}`,
  // 2026-10-19: the owner re-sorted `Cách tôi sẽ làm việc/` into one folder per step and named them;
  // each stage now shows exactly the photos/video of its own folder (ids build from the folder name —
  // see `how-i-work` in scripts/lib/config.mjs and scripts/media-roles.json). Order is the owner's
  // chosen workflow: analyse → plan/shoot → schedule → report.
  stages: [
    { id: 'audience', name: 'Phân tích nhu cầu, mục tiêu và tệp khán giả', blurb: 'Tìm hiểu mục tiêu kinh doanh, sản phẩm và tệp khán giả trước khi bắt tay vào làm.', color: '#3c4250', mediaIds: ['how-i-work-audience-i01', 'how-i-work-audience-i02', 'how-i-work-audience-i03'] },
    { id: 'plan', name: 'Lên kế hoạch và triển khai', blurb: 'Lên kế hoạch nội dung, chuẩn bị thiết bị và triển khai quay theo đúng kế hoạch.', color: '#4a3f2e', mediaIds: ['how-i-work-plan-i01', 'how-i-work-plan-i02', 'how-i-work-plan-i03', 'how-i-work-plan-i04'] },
    { id: 'schedule', name: 'Lên lịch đăng bài', blurb: 'Thiết kế, hoàn thiện nội dung và lên lịch đăng bài cho từng kênh.', color: '#35443d', mediaIds: ['how-i-work-schedule-i01', 'how-i-work-schedule-i02'] },
    { id: 'report', name: 'Báo cáo và thống kê', blurb: 'Theo dõi số liệu, tổng hợp báo cáo và tối ưu cho các chiến dịch tiếp theo.', color: '#463a44', mediaIds: ['how-i-work-report-i01', 'how-i-work-report-i02'] },
  ],
};

export const about = {
  id: 'about',
  kicker: '07 — About the Founder',
  title: 'Giới thiệu bản thân',
  intro: 'Xin chào! Mình là Thành.',
  // 2026-10-19 (owner): the single paragraph was replaced by the owner's two-paragraph bio
  // (Creative Producer / Founder). The 2nd and 3rd paragraphs removed on 2026-10-18 stay gone.
  body: [
    'Mình là <strong>Creative Producer và Founder của Drafty Lab</strong>, tập trung vào <strong>sáng tạo nội dung, sản xuất hình ảnh và phát triển trải nghiệm kỹ thuật số cho thương hiệu</strong>.',
    'Mình kết hợp tư duy thẩm mỹ, khả năng kể chuyện và công nghệ AI để tạo ra những sản phẩm sáng tạo mang bản sắc riêng, truyền tải đúng thông điệp và phục vụ mục tiêu kinh doanh.',
  ],
  card: { name: 'Thành Nguyễn', role: 'Founder & Creative Lead', badge: 'Drafty Lab' },
  tags: ['Marketing Partner', 'AI Hybrid Production'],
};

export const quickCall = {
  title: 'Quick Call in 10 Min',
  cta: 'Trao đổi ngay',
  subtitle: 'Trả lời 4 câu nhanh — phần lớn chỉ cần bấm chọn.',
  demoBanner: 'Form demo — chưa nhận lead thật',
  back: 'Quay lại',
  next: 'Tiếp tục',
  submit: 'Gửi yêu cầu',
  steps: {
    industry: {
      title: 'Lĩnh vực',
      question: 'Bạn đang kinh doanh lĩnh vực nào?',
      options: INDUSTRIES,
    },
    needs: {
      title: 'Nhu cầu',
      question: 'Bạn đang cần hỗ trợ gì nhất?',
      hint: 'Chọn một hoặc nhiều',
      options: NEEDS,
    },
    team: {
      title: 'Hiện trạng',
      question: 'Hiện bạn đang triển khai content như thế nào?',
      options: TEAMS,
    },
    // Optional question shown under the team question (same step) — the step count stays 4.
    budget: {
      question: 'Ngân sách dự kiến của bạn?',
      hint: 'Không bắt buộc',
      options: BUDGETS,
    },
    contact: {
      title: 'Liên hệ',
      question: 'Làm sao để liên hệ với bạn?',
      name: 'Tên của bạn',
      // 2026-10-18 (owner): the "Phương thức liên hệ" selector (Zalo/Phone · Email · Instagram) and the
      // consent + privacy lines were removed — one free-text field now takes a phone number OR an email,
      // and the form derives `method` from what was typed (see QuickCallForm).
      valueLabel: 'Zalo / số điện thoại hoặc email của bạn',
      valueError: 'Số điện thoại hoặc email chưa hợp lệ.',
      note: 'Ghi chú (không bắt buộc)',
      nameError: 'Vui lòng nhập tên.',
    },
  },
  demoResult: 'Đây là bản demo: yêu cầu CHƯA được gửi đi và Drafty Lab chưa nhận được thông tin của bạn. Vui lòng liên hệ trực tiếp qua email bên dưới.',
  errorResult: 'Không gửi được yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp.',
  rateLimited: 'Bạn đã gửi khá nhiều yêu cầu. Vui lòng thử lại sau vài phút hoặc liên hệ trực tiếp.',
  captchaFailed: 'Chưa xác minh được bạn là người thật. Vui lòng thử lại.',
  invalidResult: 'Một số thông tin chưa hợp lệ. Vui lòng kiểm tra lại các ô đã nhập.',
  disabledResult: 'Form tạm ngưng nhận yêu cầu. Vui lòng liên hệ trực tiếp.',
  sending: 'Đang gửi…',
  retry: 'Thử lại',
  successTitle: 'Đã nhận yêu cầu liên hệ',
  successBody: 'Drafty Lab sẽ liên hệ lại với bạn qua phương thức bạn đã chọn.',
};

export const contact = {
  temporaryFromV1: true,
  email: 'thanhnguyenphotowork@gmail.com',
  // 2026-10-19 (owner): the founder's personal IG handle replaces the old drafty.lab placeholder.
  instagram: 'https://www.instagram.com/thanh.poto.des/',
  facebook: 'https://fb.com/realthanhng',
  // 2026-10-21 (owner): Zalo shown in the footer — plain text (NO link), just the number + the Zalo icon.
  zalo: '0343813454',
};

export const footer = {
  line: 'Drafty Lab — Đối tác Marketing sáng tạo.',
  note: '',
};

export const dialog = {
  close: 'Đóng',
  loading: 'Đang mở…',
  buffering: 'Đang tải video…',
  failed: 'Không tải được nội dung. Bạn có thể đóng cửa sổ này và thử lại.',
  play: 'Phát',
  pause: 'Tạm dừng',
  mute: 'Tắt tiếng',
  unmute: 'Bật tiếng',
  seek: 'Tua video',
  prev: 'Mục trước',
  next: 'Mục sau',
  mutedNotice: 'Trình duyệt đang phát không tiếng — bấm để bật tiếng',
};

// In-place volume gauge (touch). The SloshGauge readout shows the percentage; the caption names the control.
export const volume = {
  label: 'Âm lượng',
  caption: 'Âm lượng',
};

// The language switcher's own strings moved to `src/i18n/config.ts` (LOCALE_META) when the five
// languages went live — see `src/i18n/`.
