-- Add last_quali_time column to races table
-- Stores the previous year's qualifying best lap time as a string (e.g. "1:25.123")
ALTER TABLE races ADD COLUMN IF NOT EXISTS last_quali_time VARCHAR(20);
