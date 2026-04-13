DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow users to view their own profile OR profiles referenced in approved testimonials
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create a function to get profile info for testimonials (public, no phone)
CREATE OR REPLACE FUNCTION public.get_approved_testimonials_with_profiles()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  event_id uuid,
  rating integer,
  content text,
  status text,
  created_at timestamptz,
  user_name text,
  user_avatar_url text,
  event_title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id, t.user_id, t.event_id, t.rating, t.content, t.status, t.created_at,
    p.name as user_name,
    p.avatar_url as user_avatar_url,
    e.title as event_title
  FROM public.testimonials t
  LEFT JOIN public.profiles p ON p.user_id = t.user_id
  LEFT JOIN public.events e ON e.id = t.event_id
  WHERE t.status = 'approved'
  ORDER BY t.created_at DESC
  LIMIT 6;
$$;