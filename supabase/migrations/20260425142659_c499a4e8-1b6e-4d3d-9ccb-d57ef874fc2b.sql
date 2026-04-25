DROP POLICY IF EXISTS "Anyone can view blacklist" ON public.sponsor_blacklist;

CREATE POLICY "Admins view blacklist"
  ON public.sponsor_blacklist
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));