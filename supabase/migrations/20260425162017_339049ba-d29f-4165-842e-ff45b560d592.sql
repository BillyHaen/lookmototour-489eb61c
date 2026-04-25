CREATE OR REPLACE FUNCTION public.enforce_registration_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_name text;
  _profile_phone text;
  _auth_email text;
BEGIN
  -- Admins can register on anyone's behalf with arbitrary data
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Prevent registering on behalf of another user
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot register on behalf of another user';
  END IF;

  SELECT name INTO _profile_name FROM public.profiles WHERE user_id = auth.uid();
  SELECT phone INTO _profile_phone FROM public.profile_private WHERE user_id = auth.uid();
  BEGIN
    SELECT email INTO _auth_email FROM auth.users WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    _auth_email := NULL;
  END;

  -- Override free-text identity fields with authoritative values from profile/auth
  NEW.name  := COALESCE(NULLIF(_profile_name, ''), NEW.name);
  NEW.email := COALESCE(NULLIF(_auth_email, ''), NEW.email);
  NEW.phone := COALESCE(NULLIF(_profile_phone, ''), NEW.phone);

  IF COALESCE(NEW.name,'') = '' OR COALESCE(NEW.email,'') = '' OR COALESCE(NEW.phone,'') = '' THEN
    RAISE EXCEPTION 'Profil belum lengkap. Mohon lengkapi nama, email, dan nomor telepon di halaman Profil.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_registration_identity ON public.event_registrations;
CREATE TRIGGER trg_enforce_registration_identity
BEFORE INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.enforce_registration_identity();