-- ============================================================
-- F1 Predictor — Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users Table ───
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  surname VARCHAR(50) NOT NULL,
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  address VARCHAR(200) NOT NULL,
  birthday DATE,
  telephone VARCHAR(20),
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
  points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  predictions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_points ON users (points DESC);

-- ─── Refresh Tokens Table ───
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at);

-- ─── Races Table ───
CREATE TABLE races (
  id TEXT PRIMARY KEY,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  results_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Predictions Table ───
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  submitted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, race_id)
);

CREATE INDEX idx_predictions_user_race ON predictions (user_id, race_id);
CREATE INDEX idx_predictions_race_submitted ON predictions (race_id, submitted);

-- ─── Race Results Table ───
CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id TEXT UNIQUE NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_race_results_race ON race_results (race_id);

-- ─── User Race Scores Table ───
CREATE TABLE user_race_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id TEXT NOT NULL,
  score_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, race_id)
);

CREATE INDEX idx_scores_user_race ON user_race_scores (user_id, race_id);

-- ─── DigitAlb Tokens Table ───
CREATE TABLE digitalb_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id TEXT NOT NULL,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, race_id)
);

CREATE INDEX idx_digitalb_user ON digitalb_tokens (user_id);

-- ─── Row Level Security (RLS) ───
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_race_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE digitalb_tokens ENABLE ROW LEVEL SECURITY;

-- Service role (backend) bypass: Our backend uses the service_role key,
-- which automatically bypasses RLS. No policies needed for backend access.
-- If you later add direct frontend Supabase access, add appropriate policies.

-- ─── Auto-cleanup expired refresh tokens (optional) ───
-- You can schedule this via Supabase Cron (pg_cron extension):
-- SELECT cron.schedule('cleanup-expired-tokens', '0 */6 * * *',
--   $$DELETE FROM refresh_tokens WHERE expires_at < NOW()$$
-- );
