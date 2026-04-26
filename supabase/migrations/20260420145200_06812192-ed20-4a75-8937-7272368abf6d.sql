
-- 1. Add override columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS override_total_trips integer,
  ADD COLUMN IF NOT EXISTS override_total_km numeric,
  ADD COLUMN IF NOT EXISTS override_trust_score integer,
  ADD COLUMN IF NOT EXISTS override_updated_by uuid,
  ADD COLUMN IF NOT EXISTS override_updated_at timestamptz;

-- 2. Trigger to prevent non-admins from changing override columns
CREATE OR REPLACE FUNCTION public.prevent_non_admin_override_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.override_total_trips IS DISTINCT FROM OLD.override_total_trips
      OR NEW.override_total_km IS DISTINCT FROM OLD.override_total_km
      OR NEW.override_trust_score IS DISTINCT FROM OLD.override_trust_score
      OR NEW.override_updated_by IS DISTINCT FROM OLD.override_updated_by
      OR NEW.override_updated_at IS DISTINCT FROM OLD.override_updated_at) THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can modify override fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_prevent_override_change ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_override_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_non_admin_override_change();

-- 3. Update recalc_rider_stats to honor overrides
CREATE OR REPLACE FUNCTION public.recalc_rider_stats(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trips int;
  _total_regs int;
  _km numeric;
  _avg_rating numeric;
  _completion numeric;
  _score int;
  _locations int;
  _ach RECORD;
  _ov_trips int;
  _ov_km numeric;
  _ov_score int;
  _eval_trips int;
  _eval_km numeric;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  SELECT override_total_trips, override_total_km, override_trust_score
  INTO _ov_trips, _ov_km, _ov_score
  FROM public.profiles WHERE user_id = _user_id;

  SELECT COUNT(*) INTO _trips
  FROM public.event_registrations
  WHERE user_id = _user_id AND status = 'confirmed';

  SELECT COUNT(*) INTO _total_regs
  FROM public.event_registrations WHERE user_id = _user_id;

  SELECT COALESCE(SUM(
    CASE WHEN e.distance IS NOT NULL AND e.distance <> ''
         THEN COALESCE(NULLIF(REGEXP_REPLACE(e.distance,'[^0-9.]','','g'),'')::numeric, 0)
         ELSE 0 END
  ),0) INTO _km
  FROM public.event_registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE r.user_id = _user_id AND r.status = 'confirmed';

  SELECT COALESCE(AVG(rating)::numeric,0) INTO _avg_rating
  FROM public.endorsements WHERE to_user_id = _user_id;

  SELECT COUNT(DISTINCT e.location) INTO _locations
  FROM public.event_registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE r.user_id = _user_id AND r.status = 'confirmed' AND COALESCE(e.location,'') <> '';

  _completion := CASE WHEN _total_regs > 0 THEN _trips::numeric / _total_regs ELSE 0 END;
  _score := FLOOR((_trips * 10) + (_completion * 50) + (_avg_rating * 20))::int;

  -- Write only if override is null per column
  UPDATE public.profiles
  SET total_trips = COALESCE(_ov_trips, _trips),
      total_km = COALESCE(_ov_km, _km),
      trust_score = COALESCE(_ov_score, _score),
      updated_at = now()
  WHERE user_id = _user_id;

  -- Use override values when evaluating achievements
  _eval_trips := COALESCE(_ov_trips, _trips);
  _eval_km := COALESCE(_ov_km, _km);

  FOR _ach IN SELECT * FROM public.achievements LOOP
    IF (_ach.criteria_type = 'trips' AND _eval_trips >= _ach.threshold)
       OR (_ach.criteria_type = 'km' AND _eval_km >= _ach.threshold)
       OR (_ach.criteria_type = 'locations' AND _locations >= _ach.threshold) THEN
      INSERT INTO public.user_achievements (user_id, achievement_code)
      VALUES (_user_id, _ach.code)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- 4. Update get_rider_public_profile (already returns total_trips/km/trust_score from profiles which now reflect overrides)
-- No change needed structurally; the values stored already are final.

-- 5. Admin RPC: set overrides + manual achievements
CREATE OR REPLACE FUNCTION public.admin_set_rider_overrides(
  _user_id uuid,
  _trips integer,
  _km numeric,
  _trust_score integer,
  _achievement_codes text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.profiles
  SET override_total_trips = _trips,
      override_total_km = _km,
      override_trust_score = _trust_score,
      override_updated_by = auth.uid(),
      override_updated_at = now()
  WHERE user_id = _user_id;

  IF _achievement_codes IS NOT NULL THEN
    FOREACH _code IN ARRAY _achievement_codes LOOP
      INSERT INTO public.user_achievements (user_id, achievement_code)
      VALUES (_user_id, _code)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  PERFORM public.recalc_rider_stats(_user_id);

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values, status)
  VALUES (
    auth.uid(),
    'admin_override_rider_stats',
    'profiles',
    _user_id::text,
    jsonb_build_object(
      'trips', _trips,
      'km', _km,
      'trust_score', _trust_score,
      'achievements', _achievement_codes
    ),
    'success'
  );
END;
$$;

-- 6. Admin RPC: revoke a single achievement
CREATE OR REPLACE FUNCTION public.admin_revoke_achievement(
  _user_id uuid,
  _code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  DELETE FROM public.user_achievements
  WHERE user_id = _user_id AND achievement_code = _code;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values, status)
  VALUES (
    auth.uid(),
    'admin_revoke_achievement',
    'user_achievements',
    _user_id::text,
    jsonb_build_object('code', _code),
    'success'
  );
END;
$$;
