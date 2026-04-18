-- Fix profiles.role: allow 'artist' role and default new signups to 'artist'
-- Previously: CHECK (role IN ('admin')) — blocked artist signups entirely
-- Previously: handle_new_user() hardcoded role='admin' — security hole

-- 1. Replace role constraint to allow both 'admin' and 'artist'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'artist'));

-- 2. Change default from 'admin' to 'artist' (new signups are artists by default)
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'artist';

-- 3. Recreate handle_new_user() trigger function with 'artist' default
--    Keeps existing logic: extract display_name + avatar_url from raw_user_meta_data
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, avatar_url)
  VALUES (
    new.id,
    'artist',
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 4. Recreate the trigger (CASCADE above dropped it)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
