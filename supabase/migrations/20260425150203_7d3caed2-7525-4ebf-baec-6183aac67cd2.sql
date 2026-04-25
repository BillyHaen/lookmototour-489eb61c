-- 1) media_library: remove public SELECT, restrict to admins (only place it's used)
DROP POLICY IF EXISTS "Anyone can view media" ON public.media_library;

CREATE POLICY "Admins can view media"
ON public.media_library
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) sponsor_benefit_claims: explicitly block direct INSERT by users.
-- All claims must go through public.claim_sponsor_benefit() (SECURITY DEFINER)
-- which validates quota and eligibility. Admins keep full access via existing
-- "Admins manage claims" policy.
CREATE POLICY "Block direct user inserts on claims"
ON public.sponsor_benefit_claims
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));