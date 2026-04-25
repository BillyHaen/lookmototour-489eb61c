
-- 1. Fix function search_path on the 4 email queue helpers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

-- 2. Replace overly permissive popup_events insert policy with rate-limit-safe constrained version
DROP POLICY IF EXISTS "Anyone can insert popup events" ON public.popup_events;
CREATE POLICY "Anyone can insert valid popup events"
  ON public.popup_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type IN ('impression', 'click', 'conversion', 'dismiss')
    AND (campaign_id IS NULL OR EXISTS (SELECT 1 FROM public.popup_campaigns WHERE id = campaign_id))
  );

-- 3. Restrict permissive notifications service_role insert (linter flag) — keep functionality, narrow check
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (user_id IS NOT NULL);

-- 4. Replace broad public-bucket SELECT policies that allow root listing with folder-scoped variants
-- event-images
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
-- hero-images
DROP POLICY IF EXISTS "Anyone can view hero images" ON storage.objects;
CREATE POLICY "Public read hero-images by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-images' AND (storage.foldername(name))[1] IS NOT NULL);

-- email-assets
DROP POLICY IF EXISTS "Email assets are publicly accessible" ON storage.objects;
CREATE POLICY "Public read email-assets by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'email-assets' AND (storage.foldername(name))[1] IS NOT NULL);

-- media-library
DROP POLICY IF EXISTS "Anyone can view media-library" ON storage.objects;
DROP POLICY IF EXISTS "Public read media-library" ON storage.objects;
CREATE POLICY "Public read media-library by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-library' AND (storage.foldername(name))[1] IS NOT NULL);

-- popup-images
DROP POLICY IF EXISTS "Public read popup-images" ON storage.objects;
CREATE POLICY "Public read popup-images by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'popup-images' AND (storage.foldername(name))[1] IS NOT NULL);

-- sponsor-assets
DROP POLICY IF EXISTS "Public read sponsor-assets" ON storage.objects;
CREATE POLICY "Public read sponsor-assets by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sponsor-assets' AND (storage.foldername(name))[1] IS NOT NULL);

-- garage
DROP POLICY IF EXISTS "Public read garage" ON storage.objects;
CREATE POLICY "Public read garage by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'garage' AND (storage.foldername(name))[1] IS NOT NULL);
