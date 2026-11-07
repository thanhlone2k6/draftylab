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
  // 2026-11-07 (owner): the community waitlist. The counter starts at 48 (FOMO); only real signups
  // are stored. `consent` is the sentence before the privacy-policy link.
  'waitlist.eyebrow': {
    vi: 'Cộng đồng riêng · mở ở 100 thành viên',
    en: 'Private community · opens at 100 members',
    fr: 'Communauté privée · ouvre à 100 membres',
    de: 'Private Community · öffnet bei 100 Mitgliedern',
    nl: 'Besloten community · opent bij 100 leden',
  },
  'waitlist.title': {
    vi: 'Vào danh sách chờ',
    en: 'Join the waitlist',
    fr: 'Rejoindre la liste d’attente',
    de: 'Auf die Warteliste',
    nl: 'Op de wachtlijst',
  },
  'waitlist.lead': {
    vi: 'Khi đủ 100 người, mình mở một nhóm chung để mọi người chia sẻ tài nguyên, skill và góp ý chéo cho nhau. Để lại email, mình báo bạn ngay khi nhóm mở.',
    en: 'When we reach 100 people, I’ll open a shared group where everyone can swap resources, skills and feedback. Leave your email and I’ll let you know the moment it opens.',
    fr: 'À 100 personnes, j’ouvre un groupe commun pour partager ressources, skills et retours. Laissez votre e-mail, je vous préviens dès l’ouverture.',
    de: 'Bei 100 Personen öffne ich eine gemeinsame Gruppe, in der alle Ressourcen, Skills und Feedback teilen. Hinterlassen Sie Ihre E-Mail, ich melde mich, sobald sie öffnet.',
    nl: 'Bij 100 mensen open ik een gedeelde groep waar iedereen resources, skills en feedback kan delen. Laat je e-mail achter, ik laat het weten zodra de groep opent.',
  },
  'waitlist.placeholder': {
    vi: 'ban@mail.com',
    en: 'you@mail.com',
    fr: 'vous@mail.com',
    de: 'sie@mail.com',
    nl: 'jij@mail.com',
  },
  'waitlist.emailLabel': {
    vi: 'Email của bạn',
    en: 'Your email',
    fr: 'Votre e-mail',
    de: 'Ihre E-Mail',
    nl: 'Je e-mailadres',
  },
  'waitlist.cta': { vi: 'Đăng ký', en: 'Join', fr: 'S’inscrire', de: 'Eintragen', nl: 'Aanmelden' },
  'waitlist.countLabel': {
    vi: '{count}/{goal} người đã đăng ký',
    en: '{count}/{goal} people have joined',
    fr: '{count}/{goal} personnes déjà inscrites',
    de: '{count}/{goal} Personen sind dabei',
    nl: '{count}/{goal} mensen zijn al binnen',
  },
  'waitlist.remaining': {
    vi: 'Còn {count} người nữa',
    en: '{count} spots left',
    fr: 'Encore {count} places',
    de: 'Noch {count} Plätze',
    nl: 'Nog {count} plekken',
  },
  'waitlist.full': {
    vi: 'Đã đủ 100 người — nhóm đang được mở.',
    en: 'We’ve hit 100 — the group is opening.',
    fr: 'Nous avons atteint 100 — le groupe ouvre.',
    de: 'Wir haben 100 erreicht — die Gruppe öffnet.',
    nl: 'We hebben 100 bereikt — de groep opent.',
  },
  'waitlist.success': {
    vi: 'Đã ghi danh! Bạn là người thứ {position}.',
    en: 'You’re in! You’re number {position}.',
    fr: 'C’est noté ! Vous êtes la personne n° {position}.',
    de: 'Sie sind dabei! Sie sind Nummer {position}.',
    nl: 'Je doet mee! Je bent nummer {position}.',
  },
  'waitlist.duplicate': {
    vi: 'Email này đã có trong danh sách chờ.',
    en: 'This email is already on the waitlist.',
    fr: 'Cet e-mail est déjà sur la liste.',
    de: 'Diese E-Mail steht bereits auf der Liste.',
    nl: 'Dit e-mailadres staat al op de wachtlijst.',
  },
  'waitlist.successTitle': {
    vi: 'Đã ghi danh!',
    en: 'You’re in!',
    fr: 'C’est noté !',
    de: 'Sie sind dabei!',
    nl: 'Je doet mee!',
  },
  'waitlist.successBody': {
    vi: 'Bạn là người thứ {position} trong danh sách chờ. Mình sẽ gửi email cho bạn ngay khi nhóm cộng đồng mở.',
    en: 'You’re number {position} on the waitlist. I’ll email you as soon as the community group opens.',
    fr: 'Vous êtes la personne n° {position} sur la liste d’attente. Je vous enverrai un e-mail dès que le groupe communautaire ouvrira.',
    de: 'Sie sind Nummer {position} auf der Warteliste. Ich schreibe Ihnen, sobald die Community-Gruppe öffnet.',
    nl: 'Je bent nummer {position} op de wachtlijst. Ik mail je zodra de communitygroep opent.',
  },
  'waitlist.successRemaining': {
    vi: 'Còn {count} người nữa là mở nhóm.',
    en: '{count} spots left until the group opens.',
    fr: 'Encore {count} places avant l’ouverture du groupe.',
    de: 'Noch {count} Plätze bis zur Öffnung der Gruppe.',
    nl: 'Nog {count} plekken tot de groep opent.',
  },
  'waitlist.close': { vi: 'Đóng', en: 'Close', fr: 'Fermer', de: 'Schließen', nl: 'Sluiten' },
  'waitlist.captcha': {
    vi: 'Xác minh chưa xong, bạn thử lại nhé.',
    en: 'Verification didn’t finish. Please try again.',
    fr: 'La vérification n’a pas abouti. Réessayez.',
    de: 'Die Verifizierung ist nicht abgeschlossen. Bitte erneut versuchen.',
    nl: 'Verificatie is niet afgerond. Probeer het opnieuw.',
  },
  'waitlist.sending': { vi: 'Đang gửi…', en: 'Sending…', fr: 'Envoi…', de: 'Senden…', nl: 'Versturen…' },
  'waitlist.invalid': {
    vi: 'Email chưa hợp lệ, bạn kiểm tra lại nhé.',
    en: 'That email doesn’t look right.',
    fr: 'Cet e-mail ne semble pas valide.',
    de: 'Diese E-Mail sieht nicht richtig aus.',
    nl: 'Dit e-mailadres lijkt niet te kloppen.',
  },
  'waitlist.rate': {
    vi: 'Bạn thử lại sau ít phút nhé.',
    en: 'Please try again in a few minutes.',
    fr: 'Réessayez dans quelques minutes.',
    de: 'Bitte versuchen Sie es in ein paar Minuten erneut.',
    nl: 'Probeer het over een paar minuten opnieuw.',
  },
  'waitlist.error': {
    vi: 'Chưa gửi được, bạn thử lại giúp mình.',
    en: 'Couldn’t send it. Please try again.',
    fr: 'L’envoi a échoué. Réessayez.',
    de: 'Senden hat nicht geklappt. Bitte erneut versuchen.',
    nl: 'Versturen lukte niet. Probeer het opnieuw.',
  },
  'waitlist.consent': {
    vi: 'Bằng cách bấm Đăng ký, bạn đồng ý nhận email về cộng đồng và đồng ý Drafty Lab xử lý email theo',
    en: 'By clicking Join, you agree to receive community emails and to Drafty Lab processing your email in line with the',
    fr: 'En cliquant sur S’inscrire, vous acceptez de recevoir les e-mails de la communauté et que Drafty Lab traite votre e-mail conformément à la',
    de: 'Mit Klick auf Eintragen stimmen Sie Community-E-Mails zu und dass Drafty Lab Ihre E-Mail gemäß der',
    nl: 'Door op Aanmelden te klikken, ga je akkoord met community-e-mails en met de verwerking van je e-mail door Drafty Lab volgens het',
  },
  'waitlist.homeLabel': {
    vi: '{count}/{goal} người đã đăng ký',
    en: '{count}/{goal} people have joined',
    fr: '{count}/{goal} personnes déjà inscrites',
    de: '{count}/{goal} Personen sind dabei',
    nl: '{count}/{goal} mensen zijn al binnen',
  },
  'waitlist.homeRemaining': {
    vi: 'Còn {count} người nữa',
    en: '{count} spots left',
    fr: 'Encore {count} places',
    de: 'Noch {count} Plätze',
    nl: 'Nog {count} plekken',
  },
};
