// Bindings and variables used by the Pages Functions. Secrets are configured in the Cloudflare dashboard
// (Settings → Variables and Secrets) or in .dev.vars for local runs — never in the repository.
export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  /** "false" switches the form off (UI falls back to direct contact) */
  LEAD_ENABLED?: string;
  /** comma-separated extra origins allowed to POST (the request's own origin is always allowed) */
  ALLOWED_ORIGINS?: string;
  /** Turnstile secret; when set a valid token is REQUIRED */
  TURNSTILE_SECRET?: string;
  /** random string, salts the IP hash used for rate limiting */
  RATE_SALT?: string;
  /** "resend" | "telegram" | "none" (default none: leads are stored only) */
  LEAD_NOTIFY?: string;
  RESEND_API_KEY?: string;
  LEAD_TO_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}
