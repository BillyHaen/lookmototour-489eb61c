DROP POLICY IF EXISTS "Authenticated users can view user achievements" ON public.user_achievements;

CREATE POLICY "Users view own achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can follow" ON public.follows;

CREATE POLICY "Users can follow"
ON public.follows
FOR INSERT
TO authenticated
WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

CREATE POLICY "Users can unfollow"
ON public.follows
FOR DELETE
TO authenticated
USING (follower_id = auth.uid());