
-- Campaigns table
CREATE TABLE public.popup_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  force_show_logged_in boolean NOT NULL DEFAULT false,
  start_at timestamptz,
  end_at timestamptz,
  target_device text NOT NULL DEFAULT 'all', -- all|mobile|desktop
  frequency text NOT NULL DEFAULT 'once', -- once|daily|every_session|always
  priority integer NOT NULL DEFAULT 0,
  ab_enabled boolean NOT NULL DEFAULT false,
  ab_variant text, -- A|B|null
  ab_group_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.popup_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns" ON public.popup_campaigns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view active campaigns" ON public.popup_campaigns
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at IS NULL OR end_at >= now())
  );

CREATE TRIGGER update_popup_campaigns_updated_at
  BEFORE UPDATE ON public.popup_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Slides table
CREATE TABLE public.popup_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.popup_campaigns(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  image_url text,
  content_html text NOT NULL DEFAULT '',
  cta_label text,
  cta_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.popup_slides ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_popup_slides_campaign ON public.popup_slides(campaign_id, order_index);

CREATE POLICY "Admins manage slides" ON public.popup_slides
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view slides of active campaigns" ON public.popup_slides
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.popup_campaigns c
    WHERE c.id = popup_slides.campaign_id
      AND c.is_active = true
      AND (c.start_at IS NULL OR c.start_at <= now())
      AND (c.end_at IS NULL OR c.end_at >= now())
  ));

CREATE TRIGGER update_popup_slides_updated_at
  BEFORE UPDATE ON public.popup_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Events / analytics table
CREATE TABLE public.popup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.popup_campaigns(id) ON DELETE CASCADE,
  slide_id uuid REFERENCES public.popup_slides(id) ON DELETE SET NULL,
  variant text,
  event_type text NOT NULL, -- view|slide_view|click_cta|close|dismiss_outside
  user_id uuid,
  session_id text,
  device text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.popup_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_popup_events_campaign_time ON public.popup_events(campaign_id, created_at DESC);
CREATE INDEX idx_popup_events_type ON public.popup_events(campaign_id, event_type);

CREATE POLICY "Anyone can insert popup events" ON public.popup_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins view popup events" ON public.popup_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('popup-images', 'popup-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read popup-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'popup-images');

CREATE POLICY "Admins upload popup-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'popup-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update popup-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'popup-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete popup-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'popup-images' AND has_role(auth.uid(), 'admin'::app_role));
