-- Allow vendors to upload to media-library bucket (used by ImageUpload component)
CREATE POLICY "Vendors upload media-library"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media-library' AND public.is_vendor());

CREATE POLICY "Vendors update own media-library"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media-library' AND public.is_vendor() AND owner = auth.uid())
WITH CHECK (bucket_id = 'media-library' AND public.is_vendor() AND owner = auth.uid());

CREATE POLICY "Vendors delete own media-library"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media-library' AND public.is_vendor() AND owner = auth.uid());

-- Allow public read of media-library (it's a public bucket already, but make sure)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Anyone can view media-library') THEN
    CREATE POLICY "Anyone can view media-library"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media-library');
  END IF;
END $$;