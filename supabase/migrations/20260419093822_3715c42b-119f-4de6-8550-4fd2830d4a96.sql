-- 1. sponsor_ai_config (singleton)
CREATE TABLE public.sponsor_ai_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  weight_relevance NUMERIC NOT NULL DEFAULT 1.0,
  weight_behavior NUMERIC NOT NULL DEFAULT 1.0,
  weight_priority NUMERIC NOT NULL DEFAULT 1.0,
  weight_performance NUMERIC NOT NULL DEFAULT 1.0,
  weight_trip_context NUMERIC NOT NULL DEFAULT 1.0,
  use_ai_rerank BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton_check CHECK (id = 1)
);
INSERT INTO public.sponsor_ai_config (id) VALUES (1);

ALTER TABLE public.sponsor_ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ai config" ON public.sponsor_ai_config FOR SELECT USING (true);
CREATE POLICY "Admins manage ai config" ON public.sponsor_ai_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. sponsor_boosts
CREATE TABLE public.sponsor_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  boost_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sponsor_boosts_sponsor ON public.sponsor_boosts(sponsor_id);

ALTER TABLE public.sponsor_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view boosts" ON public.sponsor_boosts FOR SELECT USING (true);
CREATE POLICY "Admins manage boosts" ON public.sponsor_boosts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. sponsor_blacklist
CREATE TABLE public.sponsor_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  segment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sponsor_id, segment)
);
CREATE INDEX idx_sponsor_blacklist_segment ON public.sponsor_blacklist(segment);

ALTER TABLE public.sponsor_blacklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blacklist" ON public.sponsor_blacklist FOR SELECT USING (true);
CREATE POLICY "Admins manage blacklist" ON public.sponsor_blacklist FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. sponsor_user_scores (cache)
CREATE TABLE public.sponsor_user_scores (
  user_id UUID NOT NULL,
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  reason JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sponsor_id)
);
CREATE INDEX idx_sponsor_user_scores_user ON public.sponsor_user_scores(user_id, score DESC);

ALTER TABLE public.sponsor_user_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scores" ON public.sponsor_user_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
-- writes via service role only (no insert/update/delete policies for users)

-- updated_at trigger for config
CREATE TRIGGER update_sponsor_ai_config_updated_at
  BEFORE UPDATE ON public.sponsor_ai_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();