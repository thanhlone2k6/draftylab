-- "Skill AI x Claude" shelf shown above the community posts.
-- Purely additive. Covers are optional (`image_key = ''`), so the seeded rows work without uploads.
-- Apply with: wrangler d1 migrations apply draftylab-v2-leads [--local|--remote]
CREATE TABLE IF NOT EXISTS community_skills (
  id          TEXT PRIMARY KEY,                  -- random, non-sequential
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL,                     -- http(s) only, validated by the API
  image_key   TEXT NOT NULL DEFAULT '',          -- file name under community/ in R2; '' = no cover
  status      TEXT NOT NULL DEFAULT 'published', -- published | hidden
  sort_order  INTEGER,                           -- higher = earlier; NULL falls back to created_at
  created_at  INTEGER NOT NULL,                  -- unix milliseconds
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_skills_order ON community_skills (status, sort_order, created_at);

-- The owner's starting list (2026-11-05). Safe to edit or delete from /admin.
INSERT OR IGNORE INTO community_skills (id, title, description, url, image_key, status, sort_order, created_at, updated_at)
VALUES
  ('11111111111111111101', 'Video Edit Skill', 'Claude Code skill: biến clip talking-head thô thành một reel Instagram hoàn chỉnh.',
   'https://github.com/tenfoldmarc/video-edit-skill', '', 'published', 3000, 1793866000000, 1793866000000),
  ('11111111111111111102', 'Herk Edit Kit', '15 skill dựng video, reels và Shorts bằng Claude Code: cắt theo transcript, kể chuyện, 406 thẻ motion.',
   'https://github.com/nateherkai/herk-edit-kit', '', 'published', 2000, 1793865900000, 1793865900000),
  ('11111111111111111103', 'Awesome Claude Video Skills', 'Danh mục 180 repo skill làm video cho Claude Code và Codex, phân loại theo kiểu và có chấm bảo mật.',
   'https://github.com/zhuyansen/awesome-claude-video-skills', '', 'published', 1000, 1793865800000, 1793865800000);
