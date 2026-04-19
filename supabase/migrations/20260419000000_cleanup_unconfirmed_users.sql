-- Auto-delete unconfirmed users after 24 hours
-- Uses pg_cron to run daily at 3:00 AM UTC

-- Enable pg_cron extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_unconfirmed_users()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete users who haven't confirmed email within 24 hours
  -- This cascades: profiles (trigger), artists (user_id FK SET NULL)
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '24 hours'
    AND id NOT IN (
      -- Exclude users who signed up via OAuth (they don't need email confirmation)
      SELECT id FROM auth.identities
      WHERE provider != 'email'
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE LOG 'cleanup_unconfirmed_users: deleted % unconfirmed users', deleted_count;
  END IF;
END;
$$;

-- Schedule: run daily at 3:00 AM UTC
SELECT cron.schedule(
  'cleanup-unconfirmed-users',
  '0 3 * * *',
  $$SELECT public.cleanup_unconfirmed_users()$$
);
