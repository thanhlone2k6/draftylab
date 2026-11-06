// Offer card on the Community page: "Custom Skill Edit x Content theo yêu cầu — 500k".
// The Vietnamese copy is the source; the other four are translations for the language switcher.
import type { Locale } from '../i18n/config';

export interface CustomSkillForm {
  title: string;
  lead: string;
  name: string;
  contact: string;
  note: string;
  submit: string;
  sending: string;
  successTitle: string;
  successBody: string;
  error: string;
}

export interface CustomSkillDoc {
  kicker: string;
  title: string;
  lead: string;
  note: string;
  name: string;
  badge: string;
  price: string;
  unit: string;
  subtitle: string;
  bullets: string[];
  cta: string;
  form: CustomSkillForm;
}

export const CUSTOM_SKILL: Record<Locale, CustomSkillDoc> = {
  vi: {
    kicker: 'Dịch vụ',
    title: 'Custom Skill Edit x Content',
    lead: 'Mình nhận viết skill riêng và edit nội dung theo đúng quy trình của bạn.',
    note: 'Bấm “Đặt yêu cầu” để mở form Quick Call.',
    name: 'Custom Skill',
    badge: 'Theo yêu cầu',
    price: '500k',
    unit: 'VND / yêu cầu',
    subtitle: 'Edit x Content theo yêu cầu',
    bullets: [
      'Skill riêng theo quy trình của bạn',
      'Edit video + viết content',
      'Bàn giao file + hướng dẫn dùng',
    ],
    cta: 'Đặt yêu cầu',
    form: {
      title: 'Đặt yêu cầu Custom Skill',
      lead: 'Để lại thông tin, mình sẽ liên hệ lại về skill và nội dung bạn cần.',
      name: 'Tên của bạn',
      contact: 'Zalo / số điện thoại hoặc email',
      note: 'Bạn cần skill/content gì? (không bắt buộc)',
      submit: 'Gửi yêu cầu',
      sending: 'Đang gửi…',
      successTitle: 'Đã nhận yêu cầu',
      successBody: 'Mình sẽ liên hệ lại với bạn sớm.',
      error: 'Không gửi được yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp.',
    },
  },
  en: {
    kicker: 'Service',
    title: 'Custom Skill Edit x Content',
    lead: 'I build a custom skill and edit your content around your own workflow.',
    note: 'Tap “Request this” to open the Quick Call form.',
    name: 'Custom Skill',
    badge: 'On request',
    price: '500k',
    unit: 'VND / request',
    subtitle: 'Edit x Content on request',
    bullets: [
      'A skill built around your workflow',
      'Video editing + content writing',
      'Files + usage guide',
    ],
    cta: 'Request this',
    form: {
      title: 'Request a Custom Skill',
      lead: 'Leave your details and I’ll get back to you about the skill and content you need.',
      name: 'Your name',
      contact: 'Zalo / phone or email',
      note: 'What skill/content do you need? (optional)',
      submit: 'Send request',
      sending: 'Sending…',
      successTitle: 'Request received',
      successBody: 'I’ll get back to you soon.',
      error: 'Could not send the request. Please try again or contact me directly.',
    },
  },
  fr: {
    kicker: 'Service',
    title: 'Custom Skill Edit x Content',
    lead: 'Je crée un skill sur mesure et monte votre contenu selon votre propre méthode.',
    note: 'Touchez « Demander » pour ouvrir le formulaire Quick Call.',
    name: 'Custom Skill',
    badge: 'Sur demande',
    price: '500k',
    unit: 'VND / demande',
    subtitle: 'Edit x Content sur demande',
    bullets: [
      'Un skill adapté à votre méthode',
      'Montage vidéo + rédaction de contenu',
      'Fichiers + guide d’utilisation',
    ],
    cta: 'Demander',
    form: {
      title: 'Demander un Custom Skill',
      lead: 'Laissez vos coordonnées, je reviendrai vers vous au sujet du skill et du contenu dont vous avez besoin.',
      name: 'Votre nom',
      contact: 'Zalo / téléphone ou e-mail',
      note: 'De quel skill/contenu avez-vous besoin ? (facultatif)',
      submit: 'Envoyer la demande',
      sending: 'Envoi…',
      successTitle: 'Demande reçue',
      successBody: 'Je vous recontacte bientôt.',
      error: 'Impossible d’envoyer la demande. Réessayez ou contactez-moi directement.',
    },
  },
  de: {
    kicker: 'Leistung',
    title: 'Custom Skill Edit x Content',
    lead: 'Ich erstelle einen individuellen Skill und bearbeite Ihre Inhalte nach Ihrem eigenen Workflow.',
    note: 'Tippen Sie auf „Anfragen“, um das Quick-Call-Formular zu öffnen.',
    name: 'Custom Skill',
    badge: 'Auf Anfrage',
    price: '500k',
    unit: 'VND / Anfrage',
    subtitle: 'Edit x Content auf Anfrage',
    bullets: [
      'Ein Skill nach Ihrem Workflow',
      'Videoschnitt + Content-Text',
      'Dateien + Anleitung',
    ],
    cta: 'Anfragen',
    form: {
      title: 'Custom Skill anfragen',
      lead: 'Hinterlassen Sie Ihre Kontaktdaten; ich melde mich zu dem Skill und den Inhalten, die Sie brauchen.',
      name: 'Ihr Name',
      contact: 'Zalo / Telefon oder E-Mail',
      note: 'Welchen Skill/Content brauchen Sie? (optional)',
      submit: 'Anfrage senden',
      sending: 'Wird gesendet…',
      successTitle: 'Anfrage erhalten',
      successBody: 'Ich melde mich bald bei Ihnen.',
      error: 'Die Anfrage konnte nicht gesendet werden. Bitte erneut versuchen oder direkt kontaktieren.',
    },
  },
  nl: {
    kicker: 'Dienst',
    title: 'Custom Skill Edit x Content',
    lead: 'Ik bouw een skill op maat en bewerk je content volgens jouw eigen workflow.',
    note: 'Tik op „Aanvragen“ om het Quick Call-formulier te openen.',
    name: 'Custom Skill',
    badge: 'Op aanvraag',
    price: '500k',
    unit: 'VND / aanvraag',
    subtitle: 'Edit x Content op aanvraag',
    bullets: [
      'Een skill op maat voor jouw workflow',
      'Video-editing + content schrijven',
      'Bestanden + handleiding',
    ],
    cta: 'Aanvragen',
    form: {
      title: 'Custom Skill aanvragen',
      lead: 'Laat je gegevens achter; ik neem contact op over de skill en content die je nodig hebt.',
      name: 'Je naam',
      contact: 'Zalo / telefoon of e-mail',
      note: 'Welke skill/content heb je nodig? (optioneel)',
      submit: 'Aanvraag versturen',
      sending: 'Versturen…',
      successTitle: 'Aanvraag ontvangen',
      successBody: 'Ik neem snel contact met je op.',
      error: 'De aanvraag kon niet worden verstuurd. Probeer opnieuw of neem direct contact op.',
    },
  },
};
