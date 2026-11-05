-- Evidence of consent for the Quick Call form (Luật 91/2025 Điều 9; NĐ 356/2025 Điều 6).
-- Additive only: existing rows keep NULL for these columns.
ALTER TABLE leads ADD COLUMN consent_at INTEGER;
ALTER TABLE leads ADD COLUMN consent_version TEXT;
ALTER TABLE leads ADD COLUMN consent_text TEXT;
