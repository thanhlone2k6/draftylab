// Single source of truth for the Quick Call choices. Imported by the form copy (content.ts), the shared
// validator, and the /api/lead Pages Function (server-side whitelist). Plain constants — no imports.
export const INDUSTRIES = ['F&B / Restaurant', 'Brand / E-commerce', 'Agency / Marketing', 'Creator / Personal Brand', 'Khác'] as const;
export const NEEDS = ['Video Editing', 'Social Content', 'Social Media Production', 'Website / Landing Page', 'Branding / AI Creative', 'Chưa rõ, cần tư vấn'] as const;
export const TEAMS = ['Tự làm', 'Có 1–2 người hỗ trợ', 'Có team 3+ người', 'Đã thuê ngoài nhưng chưa hiệu quả', 'Đang tìm đối tác dài hạn'] as const;
// DRAFT budget buckets (optional question) — NEEDS_USER_DECISION: edit this list to match real pricing.
export const BUDGETS = ['Dưới 5 triệu', '5 – 15 triệu', '15 – 30 triệu', 'Trên 30 triệu', 'Chưa xác định'] as const;
export const CONTACT_METHODS = ['phone', 'email', 'instagram'] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];
