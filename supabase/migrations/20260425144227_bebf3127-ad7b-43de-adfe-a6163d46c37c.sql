
-- 1. Create private profile table
CREATE TABLE public.profile_private (
  user_id uuid PRIMARY KEY,
  phone text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads private profile"
  ON public.profile_private FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner inserts own private profile"
  ON public.profile_private FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner updates own private profile"
  ON public.profile_private FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all private profiles"
  ON public.profile_private FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage private profiles"
  ON public.profile_private FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_profile_private_updated_at
  BEFORE UPDATE ON public.profile_private
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Migrate existing phone data
INSERT INTO public.profile_private (user_id, phone)
SELECT user_id, COALESCE(phone, '')
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 3. Drop phone column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

-- 4. Add public SELECT policy on profiles (now safe — no PII)
CREATE POLICY "Authenticated can view public profile fields"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- 5. Update handle_new_user to also create profile_private row
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _name text;
  _username text;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1));
  _username := public.generate_unique_username(_name);
  INSERT INTO public.profiles (user_id, name, username)
  VALUES (NEW.id, _name, _username);
  INSERT INTO public.profile_private (user_id, phone)
  VALUES (NEW.id, '')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 6. Update get_renter_contact_for_vendor to read phone from profile_private
CREATE OR REPLACE FUNCTION public.get_renter_contact_for_vendor(_rental_id uuid)
 RETURNS TABLE(name text, phone text, product_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _my_vid uuid;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN QUERY
    SELECT r.name, COALESCE(r.phone, pp.phone, '') AS phone, p.name AS product_name
    FROM public.gear_rentals gr
    JOIN public.products p ON p.id = gr.product_id
    LEFT JOIN public.event_registrations r ON r.id = gr.registration_id
    LEFT JOIN public.profile_private pp ON pp.user_id = gr.user_id
    WHERE gr.id = _rental_id;
    RETURN;
  END IF;

  SELECT public.get_my_vendor_id() INTO _my_vid;
  IF _my_vid IS NULL THEN
    RAISE EXCEPTION 'Not a vendor';
  END IF;

  RETURN QUERY
  SELECT r.name, COALESCE(r.phone, pp.phone, '') AS phone, p.name AS product_name
  FROM public.gear_rentals gr
  JOIN public.products p ON p.id = gr.product_id
  LEFT JOIN public.event_registrations r ON r.id = gr.registration_id
  LEFT JOIN public.profile_private pp ON pp.user_id = gr.user_id
  WHERE gr.id = _rental_id
    AND p.vendor_id = _my_vid;
END;
$function$;

-- 7. Update get_tracking_by_token to read phone from profile_private (was using profiles.phone)
CREATE OR REPLACE FUNCTION public.get_tracking_by_token(_token text)
 RETURNS TABLE(session_id uuid, google_maps_url text, status text, started_at timestamp with time zone, ended_at timestamp with time zone, expires_at timestamp with time zone, notes text, recipient_name text, participant_name text, participant_phone text, event_title text, event_location text, event_date timestamp with time zone, event_end_date timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.tracking_recipients
  SET last_accessed_at = now()
  WHERE access_token = _token;

  RETURN QUERY
  SELECT
    s.id,
    s.google_maps_url,
    s.status,
    s.started_at,
    s.ended_at,
    s.expires_at,
    s.notes,
    r.name,
    p.name,
    pp.phone,
    e.title,
    e.location,
    e.date,
    e.end_date
  FROM public.tracking_recipients r
  JOIN public.tracking_sessions s ON s.id = r.session_id
  JOIN public.events e ON e.id = s.event_id
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  LEFT JOIN public.profile_private pp ON pp.user_id = s.user_id
  WHERE r.access_token = _token;
END;
$function$;
