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
