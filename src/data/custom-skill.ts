// Offer card on the Community page: "Custom Skill Edit x Content theo yêu cầu — 500k".
// The Vietnamese copy is the source; the other four are translations for the language switcher.
import type { Locale } from '../i18n/config';

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
  },
};
