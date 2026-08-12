-- ============================================================
-- F1 Predictor — Tables Redesign Migration
-- Run this in Supabase SQL Editor AFTER migration.sql and migration_auth.sql
-- Drops and recreates: races, predictions, and adds drivers & prizes
-- ============================================================

-- ─── Drop existing tables that depend on races ───
DROP TABLE IF EXISTS user_race_scores CASCADE;
DROP TABLE IF EXISTS race_results CASCADE;
DROP TABLE IF EXISTS digitalb_tokens CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS races CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 1. DRIVERS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  team VARCHAR(100) NOT NULL,
  number INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_active ON drivers (active);
CREATE INDEX idx_drivers_team ON drivers (team);

-- ═══════════════════════════════════════════════════════════════
-- 2. RACES TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  qualifying_time TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'qualifying', 'active', 'completed', 'cancelled')),
  season INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  results_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_races_date ON races (date);
CREATE INDEX idx_races_status ON races (status);
CREATE INDEX idx_races_season ON races (season);

-- ═══════════════════════════════════════════════════════════════
-- 3. PREDICTIONS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  driver_predictions JSONB NOT NULL DEFAULT '[]',
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, race_id)
);

CREATE INDEX idx_predictions_user ON predictions (user_id);
CREATE INDEX idx_predictions_race ON predictions (race_id);
CREATE INDEX idx_predictions_user_race ON predictions (user_id, race_id);

-- ═══════════════════════════════════════════════════════════════
-- 4. PRIZES TABLE (top 3 icons)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 3),
  icon_url TEXT NOT NULL,
  label VARCHAR(50) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(position)
);

-- ═══════════════════════════════════════════════════════════════
-- 5. RACE RESULTS TABLE (recreate with UUID race_id)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID UNIQUE NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_race_results_race ON race_results (race_id);

-- ═══════════════════════════════════════════════════════════════
-- 6. USER RACE SCORES TABLE (recreate with UUID race_id)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE user_race_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  score_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, race_id)
);

CREATE INDEX idx_scores_user_race ON user_race_scores (user_id, race_id);

-- ═══════════════════════════════════════════════════════════════
-- 7. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_race_scores ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- 8. SEED DEFAULT PRIZES
-- ═══════════════════════════════════════════════════════════════
INSERT INTO prizes (position, icon_url, label) VALUES
  (1, '/prizes/gold.svg', '1st Place'),
  (2, '/prizes/silver.svg', '2nd Place'),
  (3, '/prizes/bronze.svg', '3rd Place');
