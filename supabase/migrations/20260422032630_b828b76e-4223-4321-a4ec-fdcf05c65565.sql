-- Drop previous attempts so we can recreate cleanly
DROP POLICY IF EXISTS "Vendors upload media-library" ON storage.objects;
DROP POLICY IF EXISTS "Vendors update own media-library" ON storage.objects;
DROP POLICY IF EXISTS "Vendors delete own media-library" ON storage.objects;

-- Helper: is the current user a vendor (either via role OR linked vendor record)
CREATE OR REPLACE FUNCTION public.has_vendor_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'vendor'::app_role)
    OR EXISTS (SELECT 1 FROM public.vendors WHERE owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Allow vendors to insert into media-library (no owner check on INSERT — owner is set automatically by storage)
CREATE POLICY "Vendors upload media-library"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media-library' AND public.has_vendor_access());

-- Allow vendors to update files they own in media-library
CREATE POLICY "Vendors update own media-library"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media-library' AND public.has_vendor_access() AND owner = auth.uid())
WITH CHECK (bucket_id = 'media-library' AND public.has_vendor_access() AND owner = auth.uid());

-- Allow vendors to delete files they own in media-library
CREATE POLICY "Vendors delete own media-library"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media-library' AND public.has_vendor_access() AND owner = auth.uid());