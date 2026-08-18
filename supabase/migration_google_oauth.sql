-- ============================================================
-- F1 Predictor — Google OAuth Migration
-- Run this in Supabase SQL Editor
-- Updates the handle_new_user trigger to support Google OAuth
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_name TEXT;
  v_surname TEXT;
  v_username TEXT;
  v_provider TEXT;
BEGIN
  -- Determine auth provider
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'supabase');

  -- Extract name: prefer user_metadata, then full_name split
  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1), '')
  , '');

  v_surname := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'surname', ''),
    NULLIF(
      trim(substr(
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        length(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1)) + 2
      )),
      ''
    )
  , '');

  -- Username: prefer explicit, then email prefix with random suffix for OAuth
  v_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(NEW.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
  );

  INSERT INTO public.users (id, email, name, surname, username, address, birthday, telephone, auth_provider, status)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_surname,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    NULLIF(NEW.raw_user_meta_data->>'birthday', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'telephone', ''),
    v_provider,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active' ELSE 'pending' END
  );
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
