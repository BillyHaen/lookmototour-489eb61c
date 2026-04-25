DROP POLICY IF EXISTS "Authenticated users can view follows" ON public.follows;

CREATE POLICY "Users view own follow relationships"
ON public.follows
FOR SELECT
TO authenticated
USING (
  follower_id = auth.uid()
  OR following_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);