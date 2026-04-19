
-- Enums
CREATE TYPE public.sponsor_category AS ENUM ('dealer','gear','accessories','apparel','service','other');
CREATE TYPE public.sponsor_status AS ENUM ('active','inactive');
CREATE TYPE public.sponsor_package_type AS ENUM ('bronze','silver','gold','custom');
CREATE TYPE public.sponsor_benefit_type AS ENUM ('discount','free_item','experience','test_ride');
CREATE TYPE public.sponsor_claim_status AS ENUM ('pending','claimed','used');
CREATE TYPE public.sponsor_event_type AS ENUM ('impression','click','lead','conversion');
CREATE TYPE public.sponsor_media_type AS ENUM ('banner','campaign','video');

-- Sponsors
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  hero_image_url TEXT,
  website_url TEXT,
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  category public.sponsor_category NOT NULL DEFAULT 'other',
  status public.sponsor_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active sponsors" ON public.sponsors FOR SELECT USING (status = 'active');
CREATE POLICY "Admins manage sponsors" ON public.sponsors FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Packages
CREATE TABLE public.sponsor_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  package_type public.sponsor_package_type NOT NULL DEFAULT 'bronze',
  base_price NUMERIC NOT NULL DEFAULT 0,
  cost_per_click NUMERIC NOT NULL DEFAULT 0,
  cost_per_lead NUMERIC NOT NULL DEFAULT 0,
  cost_per_conversion NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsor_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage packages" ON public.sponsor_packages FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER update_sponsor_packages_updated_at BEFORE UPDATE ON public.sponsor_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trip relations
CREATE TABLE public.sponsor_trip_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sponsor_id, event_id)
);
ALTER TABLE public.sponsor_trip_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view trip relations" ON public.sponsor_trip_relations FOR SELECT USING (true);
CREATE POLICY "Admins manage trip relations" ON public.sponsor_trip_relations FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Benefits
CREATE TABLE public.sponsor_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type public.sponsor_benefit_type NOT NULL DEFAULT 'discount',
  terms TEXT DEFAULT '',
  quota INTEGER,
  claimed_count INTEGER NOT NULL DEFAULT 0,
  valid_until DATE,
  applicable_trips UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsor_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active benefits" ON public.sponsor_benefits FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage benefits" ON public.sponsor_benefits FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER update_sponsor_benefits_updated_at BEFORE UPDATE ON public.sponsor_benefits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Benefit claims
CREATE TABLE public.sponsor_benefit_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id UUID NOT NULL REFERENCES public.sponsor_benefits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  status public.sponsor_claim_status NOT NULL DEFAULT 'claimed',
  claim_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(benefit_id, user_id)
);
ALTER TABLE public.sponsor_benefit_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own claims" ON public.sponsor_benefit_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage claims" ON public.sponsor_benefit_claims FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Media
CREATE TABLE public.sponsor_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  type public.sponsor_media_type NOT NULL DEFAULT 'banner',
  url TEXT NOT NULL,
  title TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsor_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sponsor media" ON public.sponsor_media FOR SELECT USING (true);
CREATE POLICY "Admins manage sponsor media" ON public.sponsor_media FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Events log
CREATE TABLE public.sponsor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  event_type public.sponsor_event_type NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  revenue_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsor_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view events" ON public.sponsor_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE INDEX idx_sponsor_events_sponsor_created ON public.sponsor_events(sponsor_id, created_at DESC);

-- Performance daily
CREATE TABLE public.sponsor_performance_daily (
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (sponsor_id, date)
);
ALTER TABLE public.sponsor_performance_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view performance" ON public.sponsor_performance_daily FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));

-- RPC: track event
CREATE OR REPLACE FUNCTION public.track_sponsor_event(
  _sponsor_id UUID,
  _event_type public.sponsor_event_type,
  _event_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb,
  _revenue NUMERIC DEFAULT 0
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.sponsor_events(sponsor_id, event_type, event_id, user_id, metadata, revenue_amount)
  VALUES (_sponsor_id, _event_type, _event_id, auth.uid(), COALESCE(_metadata,'{}'::jsonb), COALESCE(_revenue,0))
  RETURNING id INTO _id;

  INSERT INTO public.sponsor_performance_daily(sponsor_id, date, impressions, clicks, leads, conversions, revenue)
  VALUES (
    _sponsor_id, CURRENT_DATE,
    CASE WHEN _event_type='impression' THEN 1 ELSE 0 END,
    CASE WHEN _event_type='click' THEN 1 ELSE 0 END,
    CASE WHEN _event_type='lead' THEN 1 ELSE 0 END,
    CASE WHEN _event_type='conversion' THEN 1 ELSE 0 END,
    COALESCE(_revenue,0)
  )
  ON CONFLICT (sponsor_id, date) DO UPDATE SET
    impressions = sponsor_performance_daily.impressions + EXCLUDED.impressions,
    clicks = sponsor_performance_daily.clicks + EXCLUDED.clicks,
    leads = sponsor_performance_daily.leads + EXCLUDED.leads,
    conversions = sponsor_performance_daily.conversions + EXCLUDED.conversions,
    revenue = sponsor_performance_daily.revenue + EXCLUDED.revenue;

  RETURN _id;
END;
$$;

-- RPC: get performance
CREATE OR REPLACE FUNCTION public.get_sponsor_performance(
  _sponsor_id UUID,
  _start DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  _end DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
  date DATE, impressions INTEGER, clicks INTEGER, leads INTEGER, conversions INTEGER, revenue NUMERIC,
  total_impressions BIGINT, total_clicks BIGINT, total_leads BIGINT, total_conversions BIGINT,
  total_revenue NUMERIC, conversion_rate NUMERIC, estimated_payout NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ti BIGINT; _tc BIGINT; _tl BIGINT; _tcv BIGINT; _trev NUMERIC;
  _base NUMERIC; _cpc NUMERIC; _cpl NUMERIC; _cpcv NUMERIC;
  _payout NUMERIC; _conv_rate NUMERIC;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT
    COALESCE(SUM(impressions),0), COALESCE(SUM(clicks),0),
    COALESCE(SUM(leads),0), COALESCE(SUM(conversions),0),
    COALESCE(SUM(revenue),0)
  INTO _ti,_tc,_tl,_tcv,_trev
  FROM public.sponsor_performance_daily
  WHERE sponsor_id = _sponsor_id AND date BETWEEN _start AND _end;

  SELECT base_price, cost_per_click, cost_per_lead, cost_per_conversion
  INTO _base,_cpc,_cpl,_cpcv
  FROM public.sponsor_packages
  WHERE sponsor_id = _sponsor_id AND is_active = true
  ORDER BY created_at DESC LIMIT 1;

  _base := COALESCE(_base,0); _cpc := COALESCE(_cpc,0);
  _cpl := COALESCE(_cpl,0); _cpcv := COALESCE(_cpcv,0);
  _payout := _base + (_tc * _cpc) + (_tl * _cpl) + (_tcv * _cpcv);
  _conv_rate := CASE WHEN _tc > 0 THEN ROUND((_tcv::NUMERIC / _tc) * 100, 2) ELSE 0 END;

  RETURN QUERY
  SELECT d.date, d.impressions, d.clicks, d.leads, d.conversions, d.revenue,
         _ti, _tc, _tl, _tcv, _trev, _conv_rate, _payout
  FROM public.sponsor_performance_daily d
  WHERE d.sponsor_id = _sponsor_id AND d.date BETWEEN _start AND _end
  ORDER BY d.date;
END;
$$;

-- RPC: claim benefit
CREATE OR REPLACE FUNCTION public.claim_sponsor_benefit(
  _benefit_id UUID,
  _event_id UUID DEFAULT NULL
) RETURNS TABLE(claim_id UUID, claim_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _quota INTEGER;
  _claimed INTEGER;
  _sponsor UUID;
  _code TEXT;
  _new_id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Auth required'; END IF;

  SELECT quota, claimed_count, sponsor_id
  INTO _quota, _claimed, _sponsor
  FROM public.sponsor_benefits
  WHERE id = _benefit_id AND is_active = true
  FOR UPDATE;

  IF _sponsor IS NULL THEN RAISE EXCEPTION 'Benefit not found'; END IF;
  IF _quota IS NOT NULL AND _claimed >= _quota THEN RAISE EXCEPTION 'Quota exceeded'; END IF;

  _code := 'LMT-' || UPPER(SUBSTRING(encode(extensions.gen_random_bytes(4),'hex'),1,8));

  INSERT INTO public.sponsor_benefit_claims(benefit_id, user_id, event_id, claim_code)
  VALUES (_benefit_id, _uid, _event_id, _code)
  RETURNING id INTO _new_id;

  UPDATE public.sponsor_benefits SET claimed_count = claimed_count + 1 WHERE id = _benefit_id;

  PERFORM public.track_sponsor_event(_sponsor, 'lead', _event_id, jsonb_build_object('benefit_id', _benefit_id), 0);

  RETURN QUERY SELECT _new_id, _code;
END;
$$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('sponsor-assets','sponsor-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read sponsor-assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'sponsor-assets');
CREATE POLICY "Admins upload sponsor-assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sponsor-assets' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update sponsor-assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'sponsor-assets' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete sponsor-assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sponsor-assets' AND has_role(auth.uid(),'admin'));
