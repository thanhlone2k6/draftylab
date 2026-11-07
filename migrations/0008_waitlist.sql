-- Community waitlist (owner, 2026-11-07). The page shows a 48-person head start; only real
-- signups are stored here. Applied with: wrangler d1 migrations apply <db> [--local]
CREATE TABLE IF NOT EXISTS waitlist (
  id              TEXT PRIMARY KEY,                 -- random, non-sequential
  email           TEXT NOT NULL UNIQUE,             -- trimmed + lower-case
  created_at      INTEGER NOT NULL,                 -- unix seconds
  locale          TEXT NOT NULL DEFAULT 'vi',
  source          TEXT NOT NULL DEFAULT 'community',
  consent_at      INTEGER,                          -- evidence of consent (Luật 91/2025)
  consent_version TEXT,
  consent_text    TEXT,
  status          TEXT NOT NULL DEFAULT 'active',   -- active | unsubscribed | spam
  notify          TEXT NOT NULL DEFAULT 'pending',  -- pending | sent | failed | skipped
  notify_ref      TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist (created_at);

-- Separate rate-limit bucket so waitlist signups never consume the Quick Call form's quota
-- (and vice versa). Raw IPs are never stored: ip_hash = first 32 hex chars of SHA-256(RATE_SALT + ip).
CREATE TABLE IF NOT EXISTS waitlist_rate (
  ip_hash TEXT NOT NULL,
  ts      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_waitlist_rate_ip_ts ON waitlist_rate (ip_hash, ts);
