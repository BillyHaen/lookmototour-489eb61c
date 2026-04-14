-- Add missing UPDATE policy for blog-images
CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Add missing UPDATE policy for journal-images
CREATE POLICY "Admins can update journal images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'journal-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Fix SELECT policies: allow everyone (not just anon) to view blog/journal images
DROP POLICY IF EXISTS "Anyone can view blog images by path" ON storage.objects;
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Anyone can view journal images by path" ON storage.objects;
CREATE POLICY "Anyone can view journal images"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-images');