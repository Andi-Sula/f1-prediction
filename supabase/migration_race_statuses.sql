-- Migration: Simplify race statuses to upcoming, qualifying, race_day, completed, cancelled
-- Old statuses: upcoming, qualifying, active, waiting_race, racing, completed, cancelled
-- New statuses: upcoming, qualifying, race_day, completed, cancelled

-- Step 1: Migrate existing data to new status values
UPDATE races SET status = 'race_day' WHERE status IN ('active', 'waiting_race', 'racing');

-- Step 2: Drop old constraint and add new one
ALTER TABLE races DROP CONSTRAINT IF EXISTS races_status_check;
ALTER TABLE races ADD CONSTRAINT races_status_check CHECK (status IN ('upcoming', 'qualifying', 'race_day', 'completed', 'cancelled'));
