
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete site settings" ON public.site_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default footer settings
INSERT INTO public.site_settings (key, value) VALUES
('footer', '{
  "description": "Komunitas touring motor terpercaya di Indonesia. Jelajahi keindahan nusantara bersama kami melalui event touring, adventure, dan workshop yang seru dan aman.",
  "instagram_url": "",
  "youtube_url": "",
  "whatsapp_number": "6281234567890",
  "address": "Jakarta, Indonesia",
  "phone": "+62 812-3456-7890",
  "email": "info@lookmototour.com"
}'::jsonb);
