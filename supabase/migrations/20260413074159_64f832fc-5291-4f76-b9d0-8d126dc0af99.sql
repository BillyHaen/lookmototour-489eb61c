-- We need authenticated users to be able to read basic profile info for joins (testimonials, member profiles)
-- Since RLS is row-level (not column-level), we allow SELECT but keep phone access limited at application level
CREATE POLICY "Authenticated can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);