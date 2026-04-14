-- Add tentative_month column to events
ALTER TABLE public.events ADD COLUMN tentative_month text;

-- Create event_interests table
CREATE TABLE public.event_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own interest
CREATE POLICY "Users can insert own interest"
ON public.event_interests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can view own interests
CREATE POLICY "Users can view own interests"
ON public.event_interests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all interests
CREATE POLICY "Admins can view all interests"
ON public.event_interests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete interests
CREATE POLICY "Admins can delete interests"
ON public.event_interests FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete own interest (un-interest)
CREATE POLICY "Users can delete own interest"
ON public.event_interests FOR DELETE
TO authenticated
USING (user_id = auth.uid());