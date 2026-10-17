-- Optional budget answer + provider reference of the notification (e.g. Resend message id, or err:<status>) so a
-- delivery can be traced in the provider's log. Neither contains more personal data than the lead itself.
ALTER TABLE leads ADD COLUMN budget TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN notify_ref TEXT NOT NULL DEFAULT '';
