-- Restrict user_achievements SELECT to authenticated users only
-- Public profile pages will fetch achievements via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Anyone can view user achievements" ON public.user_achievements;

CREATE POLICY "Authenticated users can view user achievements"
  ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- RPC for public (anon-readable) achievement display by specific user_id.
-- No enumeration vector: caller must already know the target user_id.
CREATE OR REPLACE FUNCTION public.get_rider_achievements(_user_id uuid)
RETURNS TABLE (achievement_code text, unlocked_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT achievement_code, unlocked_at
  FROM public.user_achievements
  WHERE user_id = _user_id
  ORDER BY unlocked_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_rider_achievements(uuid) TO anon, authenticated;

-- sponsor_user_scores: explicitly block all client writes; only service role (edge function recommend-sponsors) writes.
-- No INSERT/UPDATE/DELETE policy means RLS denies by default for authenticated/anon.
-- Add explicit denying policies for clarity & defense-in-depth.
CREATE POLICY "Block client inserts on sponsor scores"
  ON public.sponsor_user_scores
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Block client updates on sponsor scores"
  ON public.sponsor_user_scores
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block client deletes on sponsor scores"
  ON public.sponsor_user_scores
  FOR DELETE
  TO authenticated, anon
  USING (false);