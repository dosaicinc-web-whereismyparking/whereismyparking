-- ─────────────────────────────────────────────────────────────────────────────
-- 10: Mirror GoTrue's auth.users into public.users.
--
-- Signup creates a row in auth.users (GoTrue), but parking_listings.ownerId,
-- subscriptions.ownerId, admin_users.userId, etc. all FK to PUBLIC.users — which
-- nothing populated. Result: a freshly signed-up owner could authenticate but
-- every listing/subscription insert failed with
--   "violates foreign key constraint parking_listings_ownerId_fkey".
--
-- This is the canonical Supabase handle_new_user pattern: a trigger keeps
-- public.users in lockstep with auth.users for ALL signup paths (real OTP,
-- admin-created, dev bypass), so application code never has to remember to do it.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, phone, "createdAt")
  VALUES (NEW.id::text, COALESCE(NEW.phone, NEW.id::text), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any auth.users that predate this trigger (skip id/phone collisions).
INSERT INTO public.users (id, phone, "createdAt")
SELECT au.id::text, COALESCE(au.phone, au.id::text), now()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu
  WHERE pu.id = au.id::text OR pu.phone = au.phone
);
