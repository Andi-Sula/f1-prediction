-- Add origin (country code) column to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS origin VARCHAR(2);
