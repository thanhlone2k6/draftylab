-- Quick Call leads + rate limiting. Applied with: wrangler d1 migrations apply <db> [--local]
CREATE TABLE IF NOT EXISTS leads (
  id           TEXT PRIMARY KEY,               -- random, non-sequential
  request_id   TEXT NOT NULL UNIQUE,           -- client-generated UUID → retries never create duplicates
  created_at   INTEGER NOT NULL,               -- unix seconds
  industry     TEXT NOT NULL,
  needs        TEXT NOT NULL,                  -- JSON array
  team         TEXT NOT NULL,
  name         TEXT NOT NULL,
  method       TEXT NOT NULL,                  -- phone | email | instagram
  contact      TEXT NOT NULL,
  note         TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'new',    -- new | contacted | closed | spam
  notify       TEXT NOT NULL DEFAULT 'pending' -- pending | sent | failed | skipped
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);

-- Raw IPs are never stored: ip_hash = first 32 hex chars of SHA-256(RATE_SALT + ip).
CREATE TABLE IF NOT EXISTS rate_limit (
  ip_hash TEXT NOT NULL,
  ts      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_ip_ts ON rate_limit (ip_hash, ts);
