
-- Tabel tracking_sessions
CREATE TABLE public.tracking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  google_maps_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracking_sessions_user ON public.tracking_sessions(user_id);
CREATE INDEX idx_tracking_sessions_event ON public.tracking_sessions(event_id);
CREATE INDEX idx_tracking_sessions_status ON public.tracking_sessions(status);

ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is confirmed participant
CREATE OR REPLACE FUNCTION public.is_confirmed_participant(_user_id UUID, _event_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE user_id = _user_id
      AND event_id = _event_id
      AND status = 'confirmed'
  )
$$;

-- RLS tracking_sessions
CREATE POLICY "Users can view own tracking sessions"
ON public.tracking_sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Confirmed participants can create sessions"
ON public.tracking_sessions FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_confirmed_participant(auth.uid(), event_id)
);

CREATE POLICY "Users can update own sessions"
ON public.tracking_sessions FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own sessions"
ON public.tracking_sessions FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tracking_sessions_updated_at
BEFORE UPDATE ON public.tracking_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabel tracking_recipients
CREATE TABLE public.tracking_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.tracking_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracking_recipients_session ON public.tracking_recipients(session_id);
CREATE INDEX idx_tracking_recipients_token ON public.tracking_recipients(access_token);

ALTER TABLE public.tracking_recipients ENABLE ROW LEVEL SECURITY;

-- RLS tracking_recipients (only owners; public access via SECURITY DEFINER RPC)
CREATE POLICY "Owners can view recipients"
ON public.tracking_recipients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracking_sessions s
    WHERE s.id = session_id
      AND (s.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Owners can add recipients"
ON public.tracking_recipients FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tracking_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete recipients"
ON public.tracking_recipients FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tracking_sessions s
    WHERE s.id = session_id
      AND (s.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Public RPC: fetch tracking data by access token (no auth required)
CREATE OR REPLACE FUNCTION public.get_tracking_by_token(_token TEXT)
RETURNS TABLE(
  session_id UUID,
  google_maps_url TEXT,
  status TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  recipient_name TEXT,
  participant_name TEXT,
  participant_phone TEXT,
  event_title TEXT,
  event_location TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  event_end_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update last_accessed_at
  UPDATE public.tracking_recipients
  SET last_accessed_at = now()
  WHERE access_token = _token;

  RETURN QUERY
  SELECT
    s.id,
    s.google_maps_url,
    s.status,
    s.started_at,
    s.ended_at,
    s.expires_at,
    s.notes,
    r.name,
    p.name,
    p.phone,
    e.title,
    e.location,
    e.date,
    e.end_date
  FROM public.tracking_recipients r
  JOIN public.tracking_sessions s ON s.id = r.session_id
  JOIN public.events e ON e.id = s.event_id
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  WHERE r.access_token = _token;
END;
$$;

-- Helper RPC: check if current user has any active tracking session
CREATE OR REPLACE FUNCTION public.user_has_active_tracking()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tracking_sessions
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND expires_at > now()
  )
$$;
