// Hand-edited deviations from the owner's review file.
//
// `src/i18n/strings.json` is GENERATED from `ngôn ngữ/CONTENT_I18N_5_LANGUAGES_REVIEW.md`, so anything
// the owner changes after the fact lives here instead of being lost on the next regeneration. `tr()`
// applies these on top of the generated values.
//
// 2026-10-19 (owner):
//  • "thị trường nước ngoài thì quy đổi thành đô la mỹ nhé, đức thì là tiền của đức" — the budget
//    question keeps the same buckets, only the currency changes: USD for English, EUR for DE/FR/NL.
//    Vietnamese keeps VND (5 · 15 · 30 triệu) as it always was.
//  • "thay bằng thông tin liên hệ của bạn. với thị trường nước ngoài nhé" — abroad the field is not a
//    Zalo field: it now asks for contact details in general (and accepts anything — see lead-schema).
import type { Locale } from './config';

export const OVERRIDES: Record<string, Partial<Record<Locale, string>>> = {
  // 2026-11-05 (owner): the Community tab. Its labels are translated here; the posts themselves never are.
  'nav.community': { vi: 'Cộng đồng', en: 'Community', fr: 'Communauté', de: 'Community', nl: 'Community' },
  'community.lead': {
    vi: 'Những tài liệu mới nhất dành cho cộng đồng.',
    en: 'The latest resources for the community.',
    fr: 'Les dernières ressources pour la communauté.',
    de: 'Die neuesten Materialien für die Community.',
    nl: 'De nieuwste materialen voor de community.',
  },
  'community.note': {
    vi: '',
    en: 'Resources are published in their original language.',
    fr: 'Les ressources sont publiées dans leur langue d’origine.',
    de: 'Die Materialien erscheinen in ihrer Originalsprache.',
    nl: 'De materialen verschijnen in hun oorspronkelijke taal.',
  },
  'community.empty': {
    vi: 'Tài liệu mới đang được chuẩn bị. Bạn quay lại sau nhé.',
    en: 'New resources are on the way. Please check back soon.',
    fr: 'De nouvelles ressources arrivent. Revenez bientôt.',
    de: 'Neue Materialien sind in Vorbereitung. Schauen Sie bald wieder vorbei.',
    nl: 'Er komen nieuwe materialen aan. Kom binnenkort terug.',
  },
  'community.error': {
    vi: 'Không tải được tài liệu.',
    en: 'Couldn’t load the resources.',
    fr: 'Impossible de charger les ressources.',
    de: 'Die Materialien konnten nicht geladen werden.',
    nl: 'De materialen konden niet worden geladen.',
  },
  'community.retry': { vi: 'Thử lại', en: 'Try again', fr: 'Réessayer', de: 'Erneut versuchen', nl: 'Opnieuw proberen' },
  // Accessible prefix of the date badge on each card ("Đăng ngày 05/11/2026").
  'community.posted': { vi: 'Đăng ngày', en: 'Posted', fr: 'Publié le', de: 'Veröffentlicht am', nl: 'Geplaatst op' },
  'community.seeMore': {
    vi: 'Xem thêm tài liệu',
    en: 'See more resources',
    fr: 'Voir plus de ressources',
    de: 'Weitere Materialien ansehen',
    nl: 'Meer materialen bekijken',
  },
  'community.showLess': { vi: 'Thu gọn', en: 'Show less', fr: 'Réduire', de: 'Weniger anzeigen', nl: 'Minder tonen' },
  'qc.contactValueLabel': {
    en: 'Your contact details (email, phone, WhatsApp…)',
    fr: 'Vos coordonnées (e-mail, téléphone, WhatsApp…)',
    de: 'Ihre Kontaktdaten (E-Mail, Telefon, WhatsApp …)',
    nl: 'Je contactgegevens (e-mail, telefoon, WhatsApp…)',
  },
  'qc.contactValueError': {
    en: 'Please enter how we can reach you.',
    fr: 'Indiquez comment vous joindre.',
    de: 'Bitte geben Sie an, wie wir Sie erreichen können.',
    nl: 'Vul in hoe we je kunnen bereiken.',
  },
  'qc.budgetOptions': {
    en: 'Under USD 200 · USD 200–600 · USD 600–1,200 · Over USD 1,200 · Not decided yet',
    fr: 'Moins de 200 € · 200–600 € · 600–1 200 € · Plus de 1 200 € · Pas encore défini',
    de: 'Unter 200 € · 200–600 € · 600–1.200 € · Über 1.200 € · Noch offen',
    nl: 'Minder dan € 200 · € 200–600 · € 600–1.200 · Meer dan € 1.200 · Nog niet bepaald',
  },
};
