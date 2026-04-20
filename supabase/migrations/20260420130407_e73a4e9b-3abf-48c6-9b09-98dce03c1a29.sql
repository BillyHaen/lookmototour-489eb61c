
-- ============ 1. EXTEND PROFILES ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS riding_style text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS total_trips int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score int NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (LOWER(username)) WHERE username IS NOT NULL;

-- Helper: slugify
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(_input,'')), '[^a-z0-9]+', '-', 'g'));
$$;

-- Helper: generate unique username
CREATE OR REPLACE FUNCTION public.generate_unique_username(_seed text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  base := public.slugify(COALESCE(_seed,''));
  IF base IS NULL OR base = '' THEN base := 'rider'; END IF;
  IF length(base) < 3 THEN base := base || 'rider'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(candidate)) LOOP
    i := i + 1;
    candidate := base || i::text;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Backfill existing profiles
UPDATE public.profiles
SET username = public.generate_unique_username(COALESCE(NULLIF(name,''), 'rider'))
WHERE username IS NULL;

-- Update handle_new_user to assign username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _name text;
  _username text;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1));
  _username := public.generate_unique_username(_name);
  INSERT INTO public.profiles (user_id, name, username)
  VALUES (NEW.id, _name, _username);
  RETURN NEW;
END;
$$;

-- ============ 2. GARAGE BIKES ============
CREATE TABLE IF NOT EXISTS public.garage_bikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  year int,
  description text DEFAULT '',
  photo_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.garage_bikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bikes" ON public.garage_bikes FOR SELECT USING (true);
CREATE POLICY "Owner insert bikes" ON public.garage_bikes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner update bikes" ON public.garage_bikes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Owner delete bikes" ON public.garage_bikes FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_garage_bikes_updated BEFORE UPDATE ON public.garage_bikes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 3. GARAGE GEAR ============
CREATE TABLE IF NOT EXISTS public.garage_gear (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'other',
  brand text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  photo_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.garage_gear ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gear" ON public.garage_gear FOR SELECT USING (true);
CREATE POLICY "Owner insert gear" ON public.garage_gear FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner update gear" ON public.garage_gear FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Owner delete gear" ON public.garage_gear FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_garage_gear_updated BEFORE UPDATE ON public.garage_gear
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 4. ACHIEVEMENTS ============
CREATE TABLE IF NOT EXISTS public.achievements (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'trophy',
  criteria_type text NOT NULL CHECK (criteria_type IN ('trips','km','locations')),
  threshold numeric NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins manage achievements" ON public.achievements FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.achievements (code,name,description,icon,criteria_type,threshold,sort_order) VALUES
  ('first_ride','First Ride','Selesaikan trip pertamamu','star','trips',1,10),
  ('explorer','Explorer','Selesaikan 3 trip','flame','trips',3,20),
  ('road_warrior','Road Warrior','Selesaikan 5 trip','shield','trips',5,30),
  ('legend','Legend','Selesaikan 10 trip','trophy','trips',10,40),
  ('grand_master','Grand Master','Selesaikan 20 trip','award','trips',20,50),
  ('km_100','100KM','Tempuh 100 KM total','map','km',100,60),
  ('km_500','500KM','Tempuh 500 KM total','map','km',500,70),
  ('km_1000','1000KM Club','Tempuh 1000 KM total','map-pinned','km',1000,80),
  ('km_5000','5000KM','Tempuh 5000 KM total','globe','km',5000,90),
  ('island_rider','Island Rider','Jelajahi 3+ lokasi berbeda','compass','locations',3,100)
ON CONFLICT (code) DO NOTHING;

-- ============ 5. USER ACHIEVEMENTS ============
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid NOT NULL,
  achievement_code text NOT NULL REFERENCES public.achievements(code) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_code)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements FOR SELECT USING (true);
-- No client write policies; only SECURITY DEFINER can write.

-- ============ 6. FOLLOWS ============
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (follower_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows (following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows (follower_id);

-- ============ 7. ENDORSEMENTS ============
CREATE TABLE IF NOT EXISTS public.endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view endorsements" ON public.endorsements FOR SELECT USING (true);
CREATE POLICY "Users can create endorsement" ON public.endorsements FOR INSERT WITH CHECK (from_user_id = auth.uid() AND from_user_id <> to_user_id);
CREATE POLICY "Users can delete own endorsement" ON public.endorsements FOR DELETE USING (from_user_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_endorsements_to ON public.endorsements (to_user_id);

-- ============ 8. STATS ENGINE ============
CREATE OR REPLACE FUNCTION public.recalc_rider_stats(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _trips int;
  _total_regs int;
  _km numeric;
  _avg_rating numeric;
  _completion numeric;
  _score int;
  _locations int;
  _ach RECORD;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

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

  UPDATE public.profiles
  SET total_trips = _trips,
      total_km = _km,
      trust_score = _score,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Unlock achievements
  FOR _ach IN SELECT * FROM public.achievements LOOP
    IF (_ach.criteria_type = 'trips' AND _trips >= _ach.threshold)
       OR (_ach.criteria_type = 'km' AND _km >= _ach.threshold)
       OR (_ach.criteria_type = 'locations' AND _locations >= _ach.threshold) THEN
      INSERT INTO public.user_achievements (user_id, achievement_code)
      VALUES (_user_id, _ach.code)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Trigger functions
CREATE OR REPLACE FUNCTION public.trg_recalc_on_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_rider_stats(OLD.user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_rider_stats(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_rider_stats_reg ON public.event_registrations;
CREATE TRIGGER trg_recalc_rider_stats_reg
AFTER INSERT OR UPDATE OF status OR DELETE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_on_registration();

CREATE OR REPLACE FUNCTION public.trg_recalc_on_endorsement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_rider_stats(OLD.to_user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_rider_stats(NEW.to_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_rider_stats_endorse ON public.endorsements;
CREATE TRIGGER trg_recalc_rider_stats_endorse
AFTER INSERT OR DELETE ON public.endorsements
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_on_endorsement();

-- Backfill stats for existing users
DO $$
DECLARE u RECORD;
BEGIN
  FOR u IN SELECT user_id FROM public.profiles LOOP
    PERFORM public.recalc_rider_stats(u.user_id);
  END LOOP;
END $$;

-- ============ 9. PUBLIC PROFILE RPC ============
CREATE OR REPLACE FUNCTION public.get_rider_public_profile(_username text)
RETURNS TABLE (
  user_id uuid, name text, username text, avatar_url text, banner_url text,
  bio text, riding_style text, location text,
  total_trips int, total_km numeric, trust_score int,
  follower_count bigint, following_count bigint,
  member_since timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.user_id, p.name, p.username, p.avatar_url, p.banner_url,
    p.bio, p.riding_style, p.location,
    p.total_trips, p.total_km, p.trust_score,
    (SELECT COUNT(*) FROM public.follows WHERE following_id = p.user_id),
    (SELECT COUNT(*) FROM public.follows WHERE follower_id = p.user_id),
    p.created_at
  FROM public.profiles p
  WHERE LOWER(p.username) = LOWER(_username)
  LIMIT 1;
$$;

-- ============ 10. STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('garage','garage', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read garage" ON storage.objects FOR SELECT USING (bucket_id = 'garage');
CREATE POLICY "Owner upload garage" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'garage' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update garage" ON storage.objects FOR UPDATE
  USING (bucket_id = 'garage' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete garage" ON storage.objects FOR DELETE
  USING (bucket_id = 'garage' AND auth.uid()::text = (storage.foldername(name))[1]);
