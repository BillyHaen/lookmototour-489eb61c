DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view journal images" ON storage.objects;
CREATE POLICY "Anyone can view journal images"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-images' AND (storage.foldername(name))[1] IS NOT NULL);

-- Also allow admins to SELECT (needed for upload verification)
CREATE POLICY "Admins can view blog images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'blog-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view journal images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'journal-images' AND has_role(auth.uid(), 'admin'::app_role));