-- Restrict follows table SELECT to authenticated users to prevent anonymous social graph enumeration
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;

CREATE POLICY "Authenticated users can view follows"
ON public.follows FOR SELECT
TO authenticated
USING (true);