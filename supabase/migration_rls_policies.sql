-- ============================================================
-- F1 Predictor — RLS Policies Migration
-- Run this AFTER migration.sql and migration_tables.sql
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. USERS — users can read their own profile only
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 2. PREDICTIONS — users can read and write their own predictions
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "predictions_select_own"
  ON predictions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "predictions_insert_own"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "predictions_update_own"
  ON predictions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 3. RACES — publicly readable by all (including anonymous)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "races_select_all"
  ON races FOR SELECT
  TO anon, authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 4. DRIVERS — publicly readable by all
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "drivers_select_all"
  ON drivers FOR SELECT
  TO anon, authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 5. PRIZES — publicly readable by all
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "prizes_select_all"
  ON prizes FOR SELECT
  TO anon, authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 6. RACE RESULTS — readable by all authenticated users
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "race_results_select_authenticated"
  ON race_results FOR SELECT
  TO authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 7. USER RACE SCORES — users can read their own scores
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "user_race_scores_select_own"
  ON user_race_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
