/// <reference types="astro/client" />
interface ImportMetaEnv {
  /** POST target of the Quick Call form (e.g. /api/lead). Empty → honest DEMO mode. */
  readonly PUBLIC_LEAD_ENDPOINT?: string;
  /** Cloudflare Turnstile site key (public). Empty → no captcha widget. */
  readonly PUBLIC_TURNSTILE_SITEKEY?: string;
}
