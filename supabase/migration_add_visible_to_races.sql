-- Add visible column to races table (defaults to true so existing races remain visible)
ALTER TABLE races ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT TRUE;
