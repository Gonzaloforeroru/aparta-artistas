-- Link artists to auth.users: add email and user_id columns
-- Enables artist self-service (view/edit own record after signup)

-- 1. Add email column (for matching artists to users during registration)
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS email text;

-- 2. Add user_id FK to auth.users (SET NULL on user deletion — preserve artist record)
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Case-insensitive unique index on email (prevents duplicate registrations)
CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_email ON public.artists(LOWER(email));

-- 4. Partial unique index on user_id (only non-null values — one artist per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id) WHERE user_id IS NOT NULL;
