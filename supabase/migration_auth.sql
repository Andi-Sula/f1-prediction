-- ============================================================
-- F1 Predictor — Supabase Auth Migration
-- Run this AFTER the initial migration.sql
-- Switches from custom JWT/OTP auth to Supabase Auth
-- ============================================================
--
-- IMPORTANT: Keep "Confirm email" ENABLED in Supabase Dashboard:
--   Auth → Providers → Email → "Confirm email" must be ON
-- Supabase sends a 6-digit OTP code to the user's email.
-- The frontend verifies it via supabase.auth.verifyOtp().
-- ============================================================

-- 1. Drop the password_hash column (Supabase Auth handles passwords)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- 2. Make address nullable (trigger may receive empty metadata)
ALTER TABLE users ALTER COLUMN address DROP NOT NULL;
ALTER TABLE users ALTER COLUMN address SET DEFAULT '';

-- 3. Drop refresh_tokens table (Supabase Auth handles sessions)
DROP TABLE IF EXISTS refresh_tokens;

-- 4. Create trigger: auto-create user profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, surname, username, address, birthday, telephone, auth_provider, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'surname', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    NULLIF(NEW.raw_user_meta_data->>'birthday', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'telephone', ''),
    'supabase',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active' ELSE 'pending' END
  );
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- If username or email already exists, still allow auth user creation
  -- The profile can be updated later
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create trigger: activate user profile when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_user_verified()
RETURNS trigger AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users SET status = 'active' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_verified();
