-- Restrict vendor SELECT to authenticated users to prevent anonymous scraping
-- of vendor contact_email and contact_phone.
DROP POLICY IF EXISTS "Anyone can view active vendors" ON public.vendors;

CREATE POLICY "Authenticated users can view active vendors"
ON public.vendors
FOR SELECT
TO authenticated
USING (is_active = true);