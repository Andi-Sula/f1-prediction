-- ============================================================
-- F1 Predictor — Theme Preference Migration
-- Adds theme_preference column to users table
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE users
ADD COLUMN theme_preference VARCHAR(10) NOT NULL DEFAULT 'dark'
CHECK (theme_preference IN ('dark', 'light'));
