// Locale registry for the whole site. One place that knows the five languages, their route, the
// <html lang>/og:locale they emit, the flag shown in the switcher and the Turnstile widget language.
//
// 2026-10-19: the owner supplied the translations in `ngôn ngữ/CONTENT_I18N_5_LANGUAGES_REVIEW.md`;
// they are parsed into `src/i18n/strings.json` by `scripts/i18n/parse-review.mjs`.
export const LOCALES = ['vi', 'en', 'fr', 'de', 'nl'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

export interface LocaleMeta {
  /** flag emoji shown in the switcher (Apple renders these as flags; Windows/Android show the letters) */
  flag: string;
  /** two-letter code shown next to the flag */
  short: string;
  /** endonym — a language names itself, so this is never translated */
  name: string;
  /** value for <html lang> */
  htmlLang: string;
  /** value for og:locale */
  ogLocale: string;
  /** Cloudflare Turnstile `language` option */
  turnstile: string;
  /** aria-label of the switcher button/menu in this language */
  label: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  vi: { flag: '🇻🇳', short: 'VI', name: 'Tiếng Việt', htmlLang: 'vi', ogLocale: 'vi_VN', turnstile: 'vi', label: 'Ngôn ngữ' },
  en: { flag: '🇺🇸', short: 'EN', name: 'English', htmlLang: 'en', ogLocale: 'en_US', turnstile: 'en', label: 'Language' },
  fr: { flag: '🇫🇷', short: 'FR', name: 'Français', htmlLang: 'fr', ogLocale: 'fr_FR', turnstile: 'fr', label: 'Langue' },
  de: { flag: '🇩🇪', short: 'DE', name: 'Deutsch', htmlLang: 'de', ogLocale: 'de_DE', turnstile: 'de', label: 'Sprache' },
  nl: { flag: '🇳🇱', short: 'NL', name: 'Nederlands', htmlLang: 'nl', ogLocale: 'nl_NL', turnstile: 'nl', label: 'Taal' },
};

/** Vietnamese lives at the root; every other language gets its own folder. */
export const localePath = (locale: Locale) => (locale === DEFAULT_LOCALE ? '/' : `/${locale}/`);

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

/** The non-default locales, for getStaticPaths and the switcher. */
export const OTHER_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);
