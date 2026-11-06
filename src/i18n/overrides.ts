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
  // The "Skill AI x Claude" shelf above the posts. Skill content itself is never translated.
  'community.skillsTitle': {
    vi: 'Skill AI x Claude',
    en: 'AI x Claude skills',
    fr: 'Skills IA x Claude',
    de: 'KI x Claude Skills',
    nl: 'AI x Claude-skills',
  },
  'community.skillsLead': {
    vi: 'Bộ skill mình đang dùng để dựng video, viết nội dung và làm việc với Claude. Bấm một dòng để mở repo gốc.',
    en: 'The skills I use to edit video, write and work with Claude. Tap a row to open the original repo.',
    fr: 'Les skills que j’utilise pour monter des vidéos, écrire et travailler avec Claude. Touchez une ligne pour ouvrir le dépôt.',
    de: 'Die Skills, mit denen ich Videos schneide, schreibe und mit Claude arbeite. Zeile antippen, um das Repository zu öffnen.',
    nl: 'De skills die ik gebruik om video te monteren, te schrijven en met Claude te werken. Tik op een rij om de repo te openen.',
  },
  'community.skillsEmpty': {
    vi: 'Skill mới đang được cập nhật.',
    en: 'New skills are on the way.',
    fr: 'De nouveaux skills arrivent.',
    de: 'Neue Skills sind in Vorbereitung.',
    nl: 'Nieuwe skills komen eraan.',
  },
  // The "join the community" card under Quick Call on the landing page.
  'community.joinEyebrow': {
    vi: 'Cộng đồng Drafty Lab',
    en: 'The Drafty Lab community',
    fr: 'La communauté Drafty Lab',
    de: 'Die Drafty-Lab-Community',
    nl: 'De Drafty Lab-community',
  },
  'community.joinTitle': {
    vi: 'Tham gia cộng đồng ngay',
    en: 'Join the community',
    fr: 'Rejoignez la communauté',
    de: 'Jetzt der Community beitreten',
    nl: 'Word lid van de community',
  },
  'community.joinLead': {
    vi: 'Tài liệu, skill AI x Claude và những gì mình đang làm — cập nhật mỗi ngày.',
    en: 'Resources, AI x Claude skills and what I’m working on — updated daily.',
    fr: 'Ressources, skills IA x Claude et mes projets en cours — mis à jour chaque jour.',
    de: 'Materialien, KI-x-Claude-Skills und woran ich arbeite — täglich aktualisiert.',
    nl: 'Materialen, AI x Claude-skills en waar ik aan werk — dagelijks bijgewerkt.',
  },
  'community.joinCta': {
    vi: 'Vào Cộng đồng',
    en: 'Open the community',
    fr: 'Ouvrir la communauté',
    de: 'Zur Community',
    nl: 'Naar de community',
  },
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
  // 2026-11-06: explicit consent for the Quick Call form (Luật 91/2025 Điều 9).
  // The visible text is `consentLabel + link(privacyLink) + "."`.
  'qc.consentLabel': {
    vi: 'Tôi đồng ý để Drafty Lab xử lý thông tin tôi vừa nhập để phản hồi yêu cầu này, theo',
    en: 'I agree that Drafty Lab may process the information I entered to respond to this request, in accordance with the',
    fr: 'J’accepte que Drafty Lab traite les informations que je viens de saisir afin de répondre à cette demande, conformément à la',
    de: 'Ich stimme zu, dass Drafty Lab die von mir eingegebenen Informationen zur Beantwortung dieser Anfrage verarbeitet, gemäß der',
    nl: 'Ik ga ermee akkoord dat Drafty Lab de door mij ingevoerde gegevens verwerkt om op deze aanvraag te reageren, volgens het',
  },
  'qc.privacyLink': {
    vi: 'Chính sách bảo vệ dữ liệu cá nhân',
    en: 'Personal Data Protection Policy',
    fr: 'Politique de protection des données personnelles',
    de: 'Richtlinie zum Schutz personenbezogener Daten',
    nl: 'Privacybeleid voor persoonsgegevens',
  },
  'qc.consentError': {
    vi: 'Vui lòng đồng ý với Chính sách bảo vệ dữ liệu cá nhân để gửi yêu cầu.',
    en: 'Please agree to the Personal Data Protection Policy to send your request.',
    fr: 'Veuillez accepter la Politique de protection des données personnelles pour envoyer votre demande.',
    de: 'Bitte stimmen Sie der Richtlinie zum Schutz personenbezogener Daten zu, um Ihre Anfrage zu senden.',
    nl: 'Ga akkoord met het Privacybeleid voor persoonsgegevens om je aanvraag te versturen.',
  },
};
