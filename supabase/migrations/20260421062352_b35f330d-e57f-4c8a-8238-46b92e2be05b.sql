CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);

  IF _role <> 'vendor'::app_role THEN
    UPDATE public.vendors
    SET owner_user_id = NULL
    WHERE owner_user_id = _user_id;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values, status)
  VALUES (
    auth.uid(),
    'admin_set_user_role',
    'user_roles',
    _user_id::text,
    jsonb_build_object('role', _role),
    'success'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_link_vendor_to_user(_vendor_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _previous_owner_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT owner_user_id
  INTO _previous_owner_id
  FROM public.vendors
  WHERE id = _vendor_id;

  IF _user_id IS NOT NULL THEN
    UPDATE public.vendors
    SET owner_user_id = NULL
    WHERE owner_user_id = _user_id
      AND id <> _vendor_id;
  END IF;

  UPDATE public.vendors
  SET owner_user_id = _user_id
  WHERE id = _vendor_id;

  IF _user_id IS NOT NULL AND NOT public.has_role(_user_id, 'admin'::app_role) THEN
    DELETE FROM public.user_roles
    WHERE user_id = _user_id
      AND role <> 'admin'::app_role;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'vendor'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  IF _previous_owner_id IS NOT NULL
     AND _previous_owner_id <> _user_id
     AND NOT public.has_role(_previous_owner_id, 'admin'::app_role)
     AND NOT EXISTS (
       SELECT 1
       FROM public.vendors
       WHERE owner_user_id = _previous_owner_id
     ) THEN
    DELETE FROM public.user_roles
    WHERE user_id = _previous_owner_id
      AND role = 'vendor'::app_role;

    INSERT INTO public.user_roles (user_id, role)
    SELECT _previous_owner_id, 'user'::app_role
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _previous_owner_id
    );
  END IF;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values, status)
  VALUES (
    auth.uid(),
    'admin_link_vendor_to_user',
    'vendors',
    _vendor_id::text,
    jsonb_build_object('owner_user_id', _user_id),
    'success'
  );
END;
$function$;