
-- Fix blog-images bucket: replace broad SELECT with path-based access
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
CREATE POLICY "Anyone can view blog images by path" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images' AND auth.role() = 'anon' AND (storage.foldername(name))[1] IS NOT NULL);

-- Fix journal-images bucket: replace broad SELECT with path-based access
DROP POLICY IF EXISTS "Anyone can view journal images" ON storage.objects;
CREATE POLICY "Anyone can view journal images by path" ON storage.objects FOR SELECT USING (bucket_id = 'journal-images' AND auth.role() = 'anon' AND (storage.foldername(name))[1] IS NOT NULL);
