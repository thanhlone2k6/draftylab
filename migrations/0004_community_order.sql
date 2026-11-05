-- Community tab: manual order of the cards (owner drags them in /admin) + editable posting date.
-- Purely additive: rows created before this migration keep sort_order NULL and fall back to created_at.
-- Apply with: wrangler d1 migrations apply draftylab-v2-leads [--local|--remote]
--   ORDER: COALESCE(sort_order, created_at) DESC  → un-dragged posts stay newest-first,
--   a newly created post (sort_order NULL, created_at = now) still lands on top.
ALTER TABLE community_posts ADD COLUMN sort_order INTEGER;
CREATE INDEX IF NOT EXISTS idx_community_sort ON community_posts (status, sort_order, created_at);
