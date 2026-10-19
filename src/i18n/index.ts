// The single runtime entry point for translated content.
//
// `getContent(locale)` returns the SAME shape the components have always imported from
// `src/data/content.ts` (structure, ids, hrefs, colours, urls and the "keep" values still come from
// there) with every visible string taken from `src/i18n/strings.json` — which is generated verbatim
// from the owner's review file by `scripts/i18n/parse-review.mjs`.
//
// Vietnamese is the default locale: its values in strings.json were copied from content.ts, so the
// Vietnamese site renders exactly what it did before.
import strings from './strings.json';
import { OVERRIDES } from './overrides';
import {
  LOCALES,
  LOCALE_META,
  DEFAULT_LOCALE,
  OTHER_LOCALES,
  localePath,
  isLocale,
  type Locale,
  type LocaleMeta,
} from './config';
import * as vi from '../data/content';

type Strings = Record<string, { section: string; status: string; source: string; values: Record<string, string | null> }>;
const S = strings as Strings;

/** A string in `locale`, falling back to the Vietnamese source (never an empty cell). */
export function tr(locale: Locale, id: string): string {
  // Hand-edited deviations win over the generated table (see overrides.ts).
  const override = OVERRIDES[id]?.[locale];
  if (override != null) return override;
  const row = S[id];
  if (!row) throw new Error(`i18n: unknown string id "${id}"`);
  const v = row.values[locale] ?? row.values[DEFAULT_LOCALE];
  if (v == null) throw new Error(`i18n: "${id}" has no ${locale} or ${DEFAULT_LOCALE} value`);
  return v;
}

/** The locale's own grouping/decimal marks (vi: 1.234,5 · en: 1,234.5 …) — used by CountUp. */
export function numberSeparators(locale: Locale) {
  const parts = new Intl.NumberFormat(LOCALE_META[locale].htmlLang).formatToParts(1234.5);
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  };
}

/** `{token}` interpolation — tokens stay untouched in the translation files. */
export const fmt = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

/** Split a `a · b · c` cell into its parts (used for the list-shaped rows). */
const list = (locale: Locale, id: string) => tr(locale, id).split(' · ').map((s) => s.trim());
/** Split a `a / b` cell (menu toggle, compare labels). */
const pair = (locale: Locale, id: string) => tr(locale, id).split(' / ').map((s) => s.trim());

export interface Content {
  site: { name: string; title: string; description: string; lang: string; skipLink: string };
  nav: {
    links: { label: string; href: string }[];
    cta: string;
    ariaLabel: string;
    logoAria: string;
    menuToggleAria: { open: string; close: string };
  };
  hero: { eyebrow: string; headline: [string, string]; lead: string; cta: string; portraitAlt: string };
  gallery: {
    id: string; kicker: string; title: string; lead: string;
    itemTitles: Record<string, string>;
    play: string; expand: string; notReady: string; pendingNote: string;
  };
  social: {
    id: string; kicker: string; title: string;
    carouselAria: string;
    carouselSlide: string;
    carouselLive: string;
  };
  trusted: { id: string; title: string };
  behind: {
    id: string; kicker: string; title: string;
    rawFinal: { title: string; previewRawAria: string; previewFinalAria: string };
    ai: { title: string; sliderLabel: string };
    compare: { before: string; after: string };
  };
  cases: {
    id: string; kicker: string; title: string; lead: string;
    items: { id: string; name: string; platform: string; mediaId: string; followers: string }[];
    videos: (typeof vi.cases.videos)[number][];
    tooltip: (name: string, followers: string) => string;
    videoCopy: {
      viewsLabel: string;
      cta: (platform: string) => string;
      aria: (platform: string, views: string) => string;
      play: string; pause: string; mute: string; unmute: string; seek: string;
    };
  };
  howIWork: {
    id: string; kicker: string; title: string;
    openLabel: (name: string) => string;
    folderLabel: (name: string) => string;
    stages: { id: string; name: string; blurb: string; color: string; mediaIds: string[] }[];
  };
  about: {
    id: string; kicker: string; title: string; intro: string; body: string[];
    card: { name: string; role: string; badge: string };
    tags: string[];
    portraitAlt: string;
  };
  quickCall: {
    title: string; cta: string; subtitle: string; demoBanner: string; demoBadge: string;
    back: string; next: string; submit: string; sending: string; retry: string;
    steps: {
      industry: { title: string; question: string; options: string[] };
      needs: { title: string; question: string; hint: string; options: string[] };
      team: { title: string; question: string; options: string[] };
      budget: { question: string; hint: string; options: string[] };
      contact: { title: string; question: string; name: string; valueLabel: string; valueError: string; note: string; nameError: string };
    };
    demoResult: string; errorResult: string; rateLimited: string; captchaFailed: string;
    invalidResult: string; disabledResult: string; successTitle: string; successBody: string;
    stepAria: (number: number, title: string) => string;
    turnstileLang: string;
  };
  contact: typeof vi.contact;
  footer: { line: string };
  dialog: {
    close: string; loading: string; buffering: string; failed: string;
    play: string; pause: string; mute: string; unmute: string; seek: string;
    prev: string; next: string; mutedNotice: string;
    videoControlsAria: string; contactPrefix: string; pendingBadge: string;
    loaderAnnounce: (label: string) => string;
  };
  volume: { label: string; caption: string };
  notFound: { title: string; text: string; home: string };
  languages: { label: string; options: { code: Locale; meta: LocaleMeta }[] };
}

const cache = new Map<Locale, Content>();

export function getContent(locale: Locale): Content {
  const hit = cache.get(locale);
  if (hit) return hit;
  const t = (id: string) => tr(locale, id);
  const meta = LOCALE_META[locale];

  const content: Content = {
    site: {
      name: vi.site.name, // brand — never translated
      title: t('global.siteTitle'),
      description: t('global.siteDescription'),
      lang: meta.htmlLang,
      skipLink: t('global.skipLink'),
    },
    nav: {
      links: [
        { label: t('nav.work'), href: vi.nav.links[0].href },
        { label: t('nav.services'), href: vi.nav.links[1].href },
        { label: t('nav.results'), href: vi.nav.links[2].href },
        { label: t('nav.about'), href: vi.nav.links[3].href },
      ],
      cta: t('nav.cta'),
      ariaLabel: t('nav.ariaLabel'),
      logoAria: t('nav.logoAria'),
      menuToggleAria: { open: pair(locale, 'nav.menuToggleAria')[0], close: pair(locale, 'nav.menuToggleAria')[1] },
    },
    hero: {
      eyebrow: t('hero.eyebrow'),
      headline: [t('hero.title.line1'), t('hero.title.line2')],
      lead: t('hero.lead'),
      cta: t('hero.cta'),
      portraitAlt: t('hero.portraitAlt'),
    },
    gallery: {
      id: vi.gallery.id,
      kicker: t('gallery.kicker'),
      title: t('gallery.title'),
      lead: t('gallery.lead'),
      // The owner's project names, keyed by media id (the media build's own titles stay untouched).
      itemTitles: {
        'gallery-v01': t('gallery.card01'),
        'gallery-v02': t('gallery.card02'),
        'gallery-v03': t('gallery.card03'),
        'gallery-v04': t('gallery.card04'),
      },
      play: t('gallery.play'),
      expand: t('gallery.expand'),
      notReady: t('gallery.notReady'),
      pendingNote: t('gallery.pendingNote'),
    },
    social: {
    id: vi.social.id,
    kicker: t('social.kicker'),
    title: t('social.title'),
    carouselAria: t('carousel.ariaLabel'),
    /** templates with {itemTitle} / {label} / {index} / {count} — filled in by CircularCarousel */
    carouselSlide: t('carousel.slideAria'),
    carouselLive: t('carousel.live'),
  },
    trusted: { id: vi.trusted.id, title: t('trusted.caption') },
    behind: {
      id: vi.behind.id,
      kicker: t('behind.kicker'),
      title: t('behind.title'),
      rawFinal: {
        title: t('behind.rawFinalTitle'),
        previewRawAria: t('behind.previewRawAria'),
        previewFinalAria: t('behind.previewFinalAria'),
      },
      ai: { title: t('behind.aiTitle'), sliderLabel: t('behind.sliderAria') },
      compare: { before: pair(locale, 'behind.compareLabels')[0], after: pair(locale, 'behind.compareLabels')[1] },
    },
    cases: {
      id: vi.cases.id,
      kicker: t('cases.kicker'),
      title: t('cases.title'),
      lead: t('cases.lead'),
      items: vi.cases.items, // brand names + follower counts are data, not copy
      videos: vi.cases.videos,
      tooltip: (name, followers) => fmt(t('cases.tooltipTemplate'), { name, followers }),
      videoCopy: {
        viewsLabel: t('cases.viewsLabel'),
        cta: (platform) => fmt(t('cases.videoCta'), { platform }),
        aria: (platform, views) => fmt(t('cases.videoAria'), { platform, views }),
        play: list(locale, 'cases.playerLabels')[0],
        pause: list(locale, 'cases.playerLabels')[1],
        mute: list(locale, 'cases.playerLabels')[2],
        unmute: list(locale, 'cases.playerLabels')[3],
        seek: list(locale, 'cases.playerLabels')[4],
      },
    },
    howIWork: {
      id: vi.howIWork.id,
      kicker: t('hw.kicker'),
      title: t('hw.title'),
      openLabel: (name) => fmt(t('hw.folderAria'), { name }),
      folderLabel: (name) => fmt(t('hw.folderName'), { label: name }),
      stages: vi.howIWork.stages.map((s, i) => ({
        ...s,
        name: t(`hw.stage0${i + 1}Name`),
        blurb: t(`hw.stage0${i + 1}Blurb`),
      })),
    },
    about: {
      id: vi.about.id,
      kicker: t('about.kicker'),
      title: t('about.title'),
      intro: t('about.intro'),
      body: [t('about.body1'), t('about.body2')],
      card: { name: vi.about.card.name, role: t('about.cardRole'), badge: vi.about.card.badge },
      tags: [t('about.tag01'), t('about.tag02')],
      portraitAlt: t('about.portraitAlt'),
    },
    quickCall: {
      title: t('qc.title'),
      cta: t('qc.cta'),
      subtitle: t('qc.subtitle'),
      demoBanner: t('qc.demoBanner'),
      demoBadge: t('qc.demoBadge'),
      back: t('qc.back'),
      next: t('qc.next'),
      submit: t('qc.submit'),
      sending: t('qc.sending'),
      retry: t('qc.retry'),
      steps: {
        // The form sends the STABLE Vietnamese value; only the label is translated
        // (the same strings are the server whitelist in src/lib/lead-schema.ts and sit in D1).
        industry: { title: t('qc.step1Title'), question: t('qc.step1Question'), options: list(locale, 'qc.industryOptions') },
        needs: { title: t('qc.step2Title'), question: t('qc.step2Question'), hint: t('qc.step2Hint'), options: list(locale, 'qc.needsOptions') },
        team: { title: t('qc.step3Title'), question: t('qc.step3Question'), options: list(locale, 'qc.teamOptions') },
        budget: { question: t('qc.budgetQuestion'), hint: t('qc.budgetHint'), options: list(locale, 'qc.budgetOptions') },
        contact: {
          title: t('qc.step4Title'),
          question: t('qc.contactQuestion'),
          name: t('qc.contactName'),
          valueLabel: t('qc.contactValueLabel'),
          valueError: t('qc.contactValueError'),
          note: t('qc.contactNote'),
          nameError: t('qc.contactNameError'),
        },
      },
      demoResult: t('qc.demoResult'),
      errorResult: t('qc.errorResult'),
      rateLimited: t('qc.rateLimited'),
      captchaFailed: t('qc.captchaFailed'),
      invalidResult: t('qc.invalidResult'),
      disabledResult: t('qc.disabledResult'),
      successTitle: t('qc.successTitle'),
      successBody: t('qc.successBody'),
      stepAria: (number, title) => fmt(t('qc.stepperStepAria'), { number, title }),
      turnstileLang: t('qc.turnstileLang'),
    },
    contact: vi.contact, // email + social urls — never translated
    footer: { line: t('footer.line') },
    dialog: {
      close: t('dialog.close'),
      loading: t('dialog.loading'),
      buffering: t('dialog.buffering'),
      failed: t('dialog.failed'),
      play: t('dialog.play'),
      pause: t('dialog.pause'),
      mute: t('dialog.mute'),
      unmute: t('dialog.unmute'),
      seek: t('dialog.seek'),
      prev: t('dialog.prev'),
      next: t('dialog.next'),
      mutedNotice: t('dialog.mutedNotice'),
      videoControlsAria: t('dialog.videoControlsAria'),
      contactPrefix: t('dialog.contactPrefix'),
      pendingBadge: t('dialog.pendingBadge'),
      loaderAnnounce: (label) => fmt(t('dialog.loaderAnnounce'), { label }),
    },
    volume: { label: t('volume.label'), caption: t('volume.caption') },
    notFound: { title: t('nf.title'), text: t('nf.text'), home: t('nf.home') },
    languages: { label: meta.label, options: LOCALES.map((code) => ({ code, meta: LOCALE_META[code] })) },
  };

  cache.set(locale, content);
  return content;
}

export { LOCALES, LOCALE_META, DEFAULT_LOCALE, localePath, isLocale, OTHER_LOCALES };
export type { Locale, LocaleMeta };
