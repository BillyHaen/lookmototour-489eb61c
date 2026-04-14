-- 1. Remove testimonials from realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.testimonials;

-- 2. Fix public bucket listing for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible by path"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] IS NOT NULL);

-- 3. Fix public bucket listing for event-images
DROP POLICY IF EXISTS "Public read access for event images" ON storage.objects;
CREATE POLICY "Event images are publicly accessible by path"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] IS NOT NULL);