-- 1. Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs (table_name);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only service role can insert (from edge functions / triggers run as definer)
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

-- No UPDATE or DELETE policies = no one can modify/delete (append-only)

-- 2. Generic trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _email TEXT;
  _name TEXT;
  _record_id TEXT;
  _old JSONB;
  _new JSONB;
  _action TEXT;
BEGIN
  -- Resolve actor profile
  IF _uid IS NOT NULL THEN
    SELECT name INTO _name FROM public.profiles WHERE user_id = _uid LIMIT 1;
    BEGIN
      SELECT email INTO _email FROM auth.users WHERE id = _uid LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      _email := NULL;
    END;
  END IF;

  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _new := to_jsonb(NEW);
    _record_id := COALESCE(_new->>'id', '');
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'update';
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    _record_id := COALESCE(_new->>'id', _old->>'id', '');
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'delete';
    _old := to_jsonb(OLD);
    _record_id := COALESCE(_old->>'id', '');
  END IF;

  INSERT INTO public.audit_logs (
    user_id, user_email, user_name, action, table_name, record_id,
    old_values, new_values, status
  ) VALUES (
    _uid, _email, _name, _action, TG_TABLE_NAME, _record_id,
    _old, _new, 'success'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Attach triggers to critical tables
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'events','products','event_registrations','gear_rentals',
    'vendors','sponsors','blog_posts','site_settings',
    'email_template_overrides','user_roles','profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS audit_%I_trigger ON public.%I;', t, t
    );
    EXECUTE format(
      'CREATE TRIGGER audit_%I_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();',
      t, t
    );
  END LOOP;
END $$;