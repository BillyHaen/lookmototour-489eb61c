
-- 1. Add owner_user_id to vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS owner_user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS vendors_owner_user_id_key ON public.vendors(owner_user_id) WHERE owner_user_id IS NOT NULL;

-- 2. Helper: get my vendor id
CREATE OR REPLACE FUNCTION public.get_my_vendor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.vendors WHERE owner_user_id = auth.uid() LIMIT 1
$$;

-- 3. Helper: is current user a vendor
CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'vendor'::app_role)
$$;

-- 4. PRODUCTS RLS — vendor scoped
DROP POLICY IF EXISTS "Vendors view own products" ON public.products;
DROP POLICY IF EXISTS "Vendors insert own products" ON public.products;
DROP POLICY IF EXISTS "Vendors update own products" ON public.products;
DROP POLICY IF EXISTS "Vendors delete own products" ON public.products;

CREATE POLICY "Vendors view own products" ON public.products
FOR SELECT TO authenticated
USING (public.is_vendor() AND vendor_id = public.get_my_vendor_id());

CREATE POLICY "Vendors insert own products" ON public.products
FOR INSERT TO authenticated
WITH CHECK (public.is_vendor() AND vendor_id = public.get_my_vendor_id());

CREATE POLICY "Vendors update own products" ON public.products
FOR UPDATE TO authenticated
USING (public.is_vendor() AND vendor_id = public.get_my_vendor_id())
WITH CHECK (public.is_vendor() AND vendor_id = public.get_my_vendor_id());

CREATE POLICY "Vendors delete own products" ON public.products
FOR DELETE TO authenticated
USING (public.is_vendor() AND vendor_id = public.get_my_vendor_id());

-- 5. Trigger: force vendor_id to my vendor on insert if vendor role
CREATE OR REPLACE FUNCTION public.force_vendor_id_for_vendor_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _my_vid uuid;
BEGIN
  IF public.has_role(auth.uid(), 'vendor'::app_role)
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    SELECT public.get_my_vendor_id() INTO _my_vid;
    IF _my_vid IS NULL THEN
      RAISE EXCEPTION 'Vendor account not linked to any vendor record';
    END IF;
    NEW.vendor_id := _my_vid;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_force_vendor_id ON public.products;
CREATE TRIGGER trg_force_vendor_id
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.force_vendor_id_for_vendor_role();

-- 6. GEAR RENTALS RLS — vendor can see/update rentals for own products
DROP POLICY IF EXISTS "Vendors view rentals of own products" ON public.gear_rentals;
DROP POLICY IF EXISTS "Vendors update rentals of own products" ON public.gear_rentals;

CREATE POLICY "Vendors view rentals of own products" ON public.gear_rentals
FOR SELECT TO authenticated
USING (
  public.is_vendor()
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = gear_rentals.product_id
      AND p.vendor_id = public.get_my_vendor_id()
  )
);

CREATE POLICY "Vendors update rentals of own products" ON public.gear_rentals
FOR UPDATE TO authenticated
USING (
  public.is_vendor()
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = gear_rentals.product_id
      AND p.vendor_id = public.get_my_vendor_id()
  )
)
WITH CHECK (
  public.is_vendor()
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = gear_rentals.product_id
      AND p.vendor_id = public.get_my_vendor_id()
  )
);

-- 7. VENDORS RLS — vendor can view/update own record (owner_user_id protected by trigger)
DROP POLICY IF EXISTS "Vendors view own vendor" ON public.vendors;
DROP POLICY IF EXISTS "Vendors update own vendor" ON public.vendors;

CREATE POLICY "Vendors view own vendor" ON public.vendors
FOR SELECT TO authenticated
USING (owner_user_id = auth.uid());

CREATE POLICY "Vendors update own vendor" ON public.vendors
FOR UPDATE TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

-- Trigger: prevent non-admin from changing owner_user_id
CREATE OR REPLACE FUNCTION public.prevent_non_admin_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can change vendor owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_non_admin_owner_change ON public.vendors;
CREATE TRIGGER trg_prevent_non_admin_owner_change
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.prevent_non_admin_owner_change();

-- 8. RPC: get renter contact for vendor (for WhatsApp button)
CREATE OR REPLACE FUNCTION public.get_renter_contact_for_vendor(_rental_id uuid)
RETURNS TABLE(name text, phone text, product_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _my_vid uuid;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN QUERY
    SELECT r.name, r.phone, p.name as product_name
    FROM public.gear_rentals gr
    JOIN public.products p ON p.id = gr.product_id
    LEFT JOIN public.event_registrations r ON r.id = gr.registration_id
    WHERE gr.id = _rental_id;
    RETURN;
  END IF;

  SELECT public.get_my_vendor_id() INTO _my_vid;
  IF _my_vid IS NULL THEN
    RAISE EXCEPTION 'Not a vendor';
  END IF;

  RETURN QUERY
  SELECT r.name, r.phone, p.name as product_name
  FROM public.gear_rentals gr
  JOIN public.products p ON p.id = gr.product_id
  LEFT JOIN public.event_registrations r ON r.id = gr.registration_id
  WHERE gr.id = _rental_id
    AND p.vendor_id = _my_vid;
END;
$$;

-- 9. RPC: admin set user role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Remove existing role assignments for this user
  DELETE FROM public.user_roles WHERE user_id = _user_id;

  -- Insert new role
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);

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
$$;

-- 10. RPC: admin link vendor to user
CREATE OR REPLACE FUNCTION public.admin_link_vendor_to_user(_vendor_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Unlink any other vendor for this user
  IF _user_id IS NOT NULL THEN
    UPDATE public.vendors SET owner_user_id = NULL WHERE owner_user_id = _user_id AND id <> _vendor_id;
  END IF;

  UPDATE public.vendors SET owner_user_id = _user_id WHERE id = _vendor_id;

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
$$;
