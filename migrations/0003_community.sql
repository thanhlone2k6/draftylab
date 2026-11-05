-- Community tab: resources the owner publishes daily + the login tables of the /admin page.
-- Purely additive: touches no existing table. Applied with: wrangler d1 migrations apply <db> [--local|--remote]
CREATE TABLE IF NOT EXISTS community_posts (
  id          TEXT PRIMARY KEY,                 -- random, non-sequential
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL,                    -- http(s) only, validated by the API
  image_key   TEXT NOT NULL,                    -- file name under community/ in R2
  status      TEXT NOT NULL DEFAULT 'published', -- published | hidden
  created_at  INTEGER NOT NULL,                 -- unix milliseconds
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_community_status_created ON community_posts (status, created_at);

-- At most one live login code. Only its HMAC is stored.
CREATE TABLE IF NOT EXISTS admin_login_codes (
  id         TEXT PRIMARY KEY,
  code_hash  TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL                   -- unix seconds
);

-- Only the SHA-256 of the session token is stored: a database leak cannot be replayed as a login.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL                   -- unix seconds
);

-- Login attempts for the rate limits and lockout. Raw IPs are never stored (same hash as rate_limit).
CREATE TABLE IF NOT EXISTS admin_auth_events (
  kind    TEXT NOT NULL,                        -- send | fail
  ip_hash TEXT NOT NULL,
  ts      INTEGER NOT NULL                      -- unix seconds
);
CREATE INDEX IF NOT EXISTS idx_admin_events ON admin_auth_events (kind, ts);
