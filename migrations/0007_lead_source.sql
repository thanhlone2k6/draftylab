-- Distinguish the four-step Quick Call leads from the Custom Skill contact lightbox.
-- Additive only; existing rows get 'quick-call'.
ALTER TABLE leads ADD COLUMN source TEXT NOT NULL DEFAULT 'quick-call';
